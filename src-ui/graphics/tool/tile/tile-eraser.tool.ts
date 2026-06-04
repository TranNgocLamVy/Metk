import { SetTilesCommand } from "@/application/commands/tile/set-tiles.command";
import type { HistoryManager } from "@/application/resources/history/history.manager";
import type { IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { TileLayerRenderer } from "@/graphics/renderer/tilemap/tile-layer.renderer";
import { GridStrokeTool } from "@/graphics/tool/base/grid-stroke.tool";
import { Result } from "@/shared/types/result";
import { FederatedWheelEvent, Graphics } from "pixi.js";

export class TileEraserTool extends GridStrokeTool {
    private static eraserSize = 1;

    private previewGraphics: Graphics | null = null;
    private eraseCoordinateSet: Set<string> = new Set();
    private activeHistoryManager: HistoryManager | null = null;
    private activeCommandContext: IUndoableCommandContext | null = null;
    private originalWheelEvent: ((e: FederatedWheelEvent) => boolean) | null = null;
    private isEnabled = false;
    private isTransactionStarted = false;

    public override onEnable(): void {
        this.isEnabled = true;
        this.eraseCoordinateSet.clear();
    }

    public override onDisable(): void {
        this.isEnabled = false;
        this.cancelRealtimeStrokeIfNeeded();
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
        this.cancelRealtimeStrokeIfNeeded();

        if (this.currentView && this.originalWheelEvent) {
            const wheelPlugin = this.currentView.viewport.plugins.get("wheel");
            if (wheelPlugin) wheelPlugin.wheel = this.originalWheelEvent;
        }

        this.originalWheelEvent = null;
        this.previewGraphics?.destroy();
        this.previewGraphics = null;
        super.detach();
    }

    protected isTargetLayerSupported(layerRenderer: any): layerRenderer is TileLayerRenderer {
        return layerRenderer?.layer instanceof TileLayer;
    }

    protected clearHoverPreview(): void {
        this.previewGraphics?.clear();
    }

    protected clearStrokePreview(): void {
        if (!this.isTransactionStarted) this.eraseCoordinateSet.clear();
    }

    protected drawHoverPreview(coord: Coordinate): void {
        if (!this.previewGraphics || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;

        this.previewGraphics.clear();
        const startPoint = this.targetLayerRenderer.coordToPos(coord);
        const endPoint = this.targetLayerRenderer.coordToPos({
            col: coord.col + TileEraserTool.eraserSize,
            row: coord.row + TileEraserTool.eraserSize,
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

        const session = this.editorFacade.getActiveTilemapSession();
        if (!session) return;
        const historyManager = session.historyManager;

        const updates: { coordinate: Coordinate, tileId: null, tilesetId: null }[] = [];
        const erasedKeys: string[] = [];

        for (let rowOffset = 0; rowOffset < TileEraserTool.eraserSize; rowOffset++) {
            for (let colOffset = 0; colOffset < TileEraserTool.eraserSize; colOffset++) {
                const target = { col: coord.col + colOffset, row: coord.row + rowOffset };
                const key = `${target.col},${target.row}`;
                if (!this.currentView.session.tilemap.isInBoundary(target)) continue;
                if (this.eraseCoordinateSet.has(key)) continue;
                if (!this.targetLayerRenderer.layer.getTileRefAt(target)) continue;
                updates.push({ coordinate: target, tileId: null, tilesetId: null });
                erasedKeys.push(key);
            }
        }

        if (updates.length === 0) return;

        this.ensureStrokeTransactionStarted(historyManager, session);
        const result = historyManager.execute(
            new SetTilesCommand(this.targetLayerRenderer.tilemap.objectId, this.targetLayerRenderer.layer.objectId, updates),
            session,
        );

        if (result.status === Result.Status.Success) {
            erasedKeys.forEach((key) => this.eraseCoordinateSet.add(key));
        }
    }

    protected commitStroke(): void {
        this.commitRealtimeStrokeIfNeeded();
    }

    private onWheel(e: FederatedWheelEvent): boolean {
        const deltaY = e.deltaY > 0 ? 1 : -1;
        TileEraserTool.eraserSize = Math.max(1, TileEraserTool.eraserSize - deltaY);
        if (this.currentCoordinate) this.drawHoverPreview(this.currentCoordinate);
        return false;
    }

    private ensureStrokeTransactionStarted(historyManager: HistoryManager, context: IUndoableCommandContext): void {
        if (this.isTransactionStarted) return;

        historyManager.startTransaction();
        this.activeHistoryManager = historyManager;
        this.activeCommandContext = context;
        this.isTransactionStarted = true;
    }

    private commitRealtimeStrokeIfNeeded(): void {
        if (!this.isTransactionStarted) return;

        this.activeHistoryManager?.commitTransaction();
        this.activeHistoryManager = null;
        this.activeCommandContext = null;
        this.isTransactionStarted = false;
    }

    private cancelRealtimeStrokeIfNeeded(): void {
        if (!this.isTransactionStarted) return;

        if (this.activeHistoryManager && this.activeCommandContext) {
            this.activeHistoryManager.cancelTransaction(this.activeCommandContext);
        }
        this.activeHistoryManager = null;
        this.activeCommandContext = null;
        this.isTransactionStarted = false;
        this.eraseCoordinateSet.clear();
    }
}
