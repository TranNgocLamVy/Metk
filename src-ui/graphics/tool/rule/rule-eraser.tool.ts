import { SetRulesCommand } from "@/application/commands/tile/set-rules.command";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { RuleLayerRenderer } from "@/graphics/renderer/tilemap/rule-layer.renderer";
import { GridStrokeTool } from "@/graphics/tool/base/grid-stroke.tool";
import { FederatedWheelEvent, Graphics } from "pixi.js";

export class RuleEraserTool extends GridStrokeTool {
    private static eraserSize = 1;

    private previewGraphics: Graphics | null = null;
    private eraseCoordinateSet: Set<string> = new Set();
    private originalWheelEvent: ((e: FederatedWheelEvent) => boolean) | null = null;
    private isEnabled = false;

    public override onEnable(): void {
        this.isEnabled = true;
        this.eraseCoordinateSet.clear();
    }

    public override onDisable(): void {
        this.isEnabled = false;
        super.onDisable();
    }

    public override attachView(view: any): void {
        super.attachView(view);
        this.previewGraphics = new Graphics();
        this.overlayContainer?.addChild(this.previewGraphics);

        const wheelPlugin = view.viewport.plugins.get("wheel");
        if (!wheelPlugin) return;

        this.originalWheelEvent = wheelPlugin.wheel;
        wheelPlugin.wheel = (e: FederatedWheelEvent) => {
            if (this.isEnabled && e.ctrlKey) return this.onWheel(e);
            return this.originalWheelEvent!.call(wheelPlugin, e);
        };
    }

    public override detach(): void {
        if (this.currentView && this.originalWheelEvent) {
            const wheelPlugin = this.currentView.viewport.plugins.get("wheel");
            if (wheelPlugin) wheelPlugin.wheel = this.originalWheelEvent;
        }

        this.originalWheelEvent = null;
        this.previewGraphics?.destroy();
        this.previewGraphics = null;
        super.detach();
    }

    protected isTargetLayerSupported(layerRenderer: any): layerRenderer is RuleLayerRenderer {
        return layerRenderer?.layer instanceof RuleLayer;
    }

    protected clearHoverPreview(): void {
        this.previewGraphics?.clear();
    }

    protected clearStrokePreview(): void {
        this.eraseCoordinateSet.clear();
    }

    protected drawHoverPreview(coord: Coordinate): void {
        if (!this.previewGraphics || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;

        this.previewGraphics.clear();
        const startPoint = this.targetLayerRenderer.coordToPos(coord);
        const endPoint = this.targetLayerRenderer.coordToPos({
            col: coord.col + RuleEraserTool.eraserSize,
            row: coord.row + RuleEraserTool.eraserSize,
        });

        this.previewGraphics.moveTo(startPoint.x, startPoint.y)
            .lineTo(endPoint.x, startPoint.y)
            .lineTo(endPoint.x, endPoint.y)
            .lineTo(startPoint.x, endPoint.y)
            .lineTo(startPoint.x, startPoint.y)
            .stroke({ color: 0xff0000, pixelLine: true });

        this.previewGraphics.rect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y)
            .fill({ color: 0xff0000, alpha: 0.25 });
    }

    protected collectStrokeAt(coord: Coordinate): void {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        for (let rowOffset = 0; rowOffset < RuleEraserTool.eraserSize; rowOffset++) {
            for (let colOffset = 0; colOffset < RuleEraserTool.eraserSize; colOffset++) {
                const target = { col: coord.col + colOffset, row: coord.row + rowOffset };
                if (!this.currentView.session.tilemap.isInBoundary(target)) continue;
                if (!this.targetLayerRenderer.layer.getRulesetRefAt(target)) continue;
                this.eraseCoordinateSet.add(`${target.col},${target.row}`);
            }
        }
    }

    protected commitStroke(): void {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const historyManager = this.editorFacade.getCurrentHistoryManager();
        if (!historyManager || this.eraseCoordinateSet.size === 0) return;

        const updates = Array.from(this.eraseCoordinateSet).map((key) => {
            const [col, row] = key.split(",").map(Number);
            return { coordinate: { col, row }, rulesetId: null };
        });

        historyManager.startTransaction();
        historyManager.execute(
            new SetRulesCommand(this.targetLayerRenderer.tilemap.objectId, this.targetLayerRenderer.layer.objectId, updates),
            this.editorFacade,
        );
        historyManager.commitTransaction();
    }

    private onWheel(e: FederatedWheelEvent): boolean {
        const deltaY = e.deltaY > 0 ? 1 : -1;
        RuleEraserTool.eraserSize = Math.max(1, RuleEraserTool.eraserSize - deltaY);
        if (this.currentCoordinate) this.drawHoverPreview(this.currentCoordinate);
        return false;
    }
}
