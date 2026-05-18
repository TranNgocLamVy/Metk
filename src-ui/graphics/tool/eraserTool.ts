import { Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, Point } from "pixi.js";

import eraser from "@/assets/icons/eraser.svg?raw";
import { EditorContext } from "@/editor/application/editorContext";
import { RuleLayer } from "@/editor/application/tile/layer/ruleLayer";
import { TileLayer } from "@/editor/application/tile/layer/tileLayer";
import { SetRuleRefsCommand } from "@/editor/command/tile/setRulesCommand";
import { SetTilesCommand } from "@/editor/command/tile/setTilesCommand";
import { IBaseCommand } from "@/editor/interface/IBaseCommand";
import { ITool } from "@/editor/interface/ITool";
import { GeometryUtils } from "@/shared/utils/geometryUtils";
import { IDrawStrategy } from "../drawStrategy/IDrawStrategy";
import { BaseLayerRenderer } from "../renderer/baseLayerRenderer";
import { TilemapView } from "../view/tilemapView";
import { Tool } from "./tool.decorator";
import { BatchCommand } from "@/editor/command/batchCommand";

@Tool({
    id: "tool.eraser",
    label: "workspace.tool.eraser.label",
    displayOnToolbar: {
        icon: eraser,
        tooltip: "workspace.tool.eraser.description",
        index: 10,
    },
    shortcuts: ["E"],
    when: "inWorkspace && !isModalOpen",
})
export class EraserTool implements ITool {
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentView: TilemapView | null = null;

    private overlayContainer: Container | null = null;

    private previousPreviewCoordinate: Coordinate = null!;
    private currentPreviewCoordinate: Coordinate = null!;
    private eraseCoordinateSet: Set<string> = new Set();

    private isDragging: boolean = false;
    private previewGraphics: Graphics | null = null;
    private static eraserSize: number = 1;

    private targetLayerRenderer: BaseLayerRenderer | null = null;

    private isEnabled: boolean = false;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;
    private originalWheelEvent: (e: FederatedWheelEvent) => boolean;

    private eraseCommandStack: IBaseCommand[] = [];

    constructor(private readonly editorContext: EditorContext) {
        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
    }

    public onEnable(): void {
        this.isEnabled = true;
        this.eraseCoordinateSet = new Set<string>();
    }

    public onDisable(): void {
        this.isEnabled = false;

        if (this.previewGraphics) this.previewGraphics.clear();

        this.isDragging = false;
        this.previousPreviewCoordinate = null!;
        this.currentPreviewCoordinate = null!;
        this.targetLayerRenderer = null;
        this.eraseCoordinateSet.clear();

        this.reverseErase();
    }

    public attachView(view: TilemapView): void {
        this.currentView = view;

        const viewport = this.currentView.viewport;

        this.overlayContainer = this.currentView.overlayerContainer;

        this.previewGraphics = new Graphics();
        this.overlayContainer.addChild(this.previewGraphics);

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
        viewport.addEventListener("mouseleave", this.bindPointerOutside);

        const wheelPlugin = viewport.plugins.get('wheel');
        const originalWheelEvent = wheelPlugin!.wheel;
        this.originalWheelEvent = originalWheelEvent;
        const self = this;
        wheelPlugin!.wheel = function (e: FederatedWheelEvent) {
            if (self.isEnabled && e.ctrlKey) return self.onWheel(e);
            return originalWheelEvent.call(this, e);
        };
    }

    public detach(): void {
        if (!this.currentView) return;
        const viewport = this.currentView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        const wheelPlugin = viewport.plugins.get('wheel')!;
        wheelPlugin.wheel = this.originalWheelEvent;

        this.currentView = null;

        if (this.previewGraphics) this.previewGraphics.destroy();
        this.previewGraphics = null;

        this.isDragging = false;
        this.previousPreviewCoordinate = null!;
        this.currentPreviewCoordinate = null!;
        this.targetLayerRenderer = null;
        this.eraseCoordinateSet.clear();

        this.reverseErase();
    }

    public setDrawStrategy(strategy: IDrawStrategy | null): void {
        this.activeDrawStrategy = strategy;
    }

    public setTargetLayerRenderer(layerRenderer: BaseLayerRenderer | null): void {
        this.targetLayerRenderer = layerRenderer;
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (e.button !== 0) return;
        if (!this.currentView || !this.targetLayerRenderer || !this.activeDrawStrategy) return;
        this.isDragging = true;
        this.previousPreviewCoordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        this.eraseMove(e);
    }

    private onPointerMove(e: FederatedPointerEvent) {
        if (!this.currentView || !this.targetLayerRenderer || !this.activeDrawStrategy) return;

        const newCoordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        this.currentPreviewCoordinate = newCoordinate;
        this.drawPreviewErase();

        if (!this.isDragging) return;
        this.eraseMove(e);
    }

    private onPointerUp(e: FederatedPointerEvent) {
        if (!this.currentView) return;
        if (!this.isDragging) return;
        this.isDragging = false;
        this.eraseEnd(e);
    }

    private onPointerOutside(e: FederatedPointerEvent) {
        this.previewGraphics?.clear();
    }

    private onWheel(e: FederatedWheelEvent): boolean {
        const deltaY = e.deltaY > 0 ? 1 : -1;
        EraserTool.eraserSize = Math.max(1, EraserTool.eraserSize - deltaY);
        this.drawPreviewErase();
        return false;
    }

    private drawPreviewErase() {
        if (!this.currentView || !this.previewGraphics || !this.targetLayerRenderer) return;

        this.previewGraphics.clear();

        const startPoint = this.targetLayerRenderer.coordToPos(this.currentPreviewCoordinate);

        const endPoint = this.targetLayerRenderer.coordToPos({
            col: this.currentPreviewCoordinate.col + EraserTool.eraserSize,
            row: this.currentPreviewCoordinate.row + EraserTool.eraserSize
        });

        this.previewGraphics.moveTo(startPoint.x, startPoint.y)
            .lineTo(endPoint.x, startPoint.y)
            .lineTo(endPoint.x, endPoint.y)
            .lineTo(startPoint.x, endPoint.y)
            .lineTo(startPoint.x, startPoint.y)
            .stroke({ color: 0xff0000, pixelLine: true });

        this.previewGraphics.rect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y).fill({ color: 0xff0000, alpha: 0.25 });
    }

    private eraseMove(e: FederatedPointerEvent) {
        if (!this.isDragging) return;

        if (!this.targetLayerRenderer) return;

        const drawCoordinates = GeometryUtils.calculateLine(this.previousPreviewCoordinate, this.currentPreviewCoordinate);
        if (drawCoordinates.length == 0) drawCoordinates.push(this.currentPreviewCoordinate);

        const eraseCoordinates = new Array<Coordinate>();

        drawCoordinates.forEach(drawCoordinate => {
            for (let r = 0; r < EraserTool.eraserSize; r++) {
                for (let c = 0; c < EraserTool.eraserSize; c++) {
                    const targetX = drawCoordinate.col + c;
                    const targetY = drawCoordinate.row + r;
                    if (targetX < 0 || targetX >= this.currentView!.session.tilemap.width ||
                        targetY < 0 || targetY >= this.currentView!.session.tilemap.height) {
                        continue;
                    }
                    const coord = { col: targetX, row: targetY };
                    const key = `${coord.col},${coord.row}`;
                    if (this.eraseCoordinateSet.has(key)) continue;
                    if (!this.activeDrawStrategy!.getRefAt(this.targetLayerRenderer!.coordToPos(coord), this.targetLayerRenderer!)) continue;

                    this.eraseCoordinateSet.add(key);
                    eraseCoordinates.push(coord);
                }
            }
        })

        if (eraseCoordinates.length != 0) {
            let eraseCommand: IBaseCommand;

            // TODO: Move this into strategy
            if (this.targetLayerRenderer.layer instanceof TileLayer) {
                eraseCommand = new SetTilesCommand(this.targetLayerRenderer.layer.id, eraseCoordinates.map(c => ({ coordinate: c, tileId: null, tilesetId: null })));
            } else if (this.targetLayerRenderer.layer instanceof RuleLayer) {
                eraseCommand = new SetRuleRefsCommand(this.targetLayerRenderer.layer.id, eraseCoordinates.map(c => ({ coordinate: c, rulesetId: null })));
            } else {
                return;
            }
            eraseCommand.execute(this.editorContext);
            this.eraseCommandStack.push(eraseCommand);
        }

        this.previousPreviewCoordinate = this.currentPreviewCoordinate;
    }

    private eraseEnd(e: FederatedPointerEvent) {
        this.eraseCoordinateSet.clear();

        const historyManager = this.editorContext.getCurrentHistoryManager();
        if (!historyManager) {
            this.reverseErase();
            return;
        }

        if (this.eraseCommandStack.length == 0) return;

        const batchCommand = new BatchCommand(this.eraseCommandStack);
        historyManager.pushToUndoStack(batchCommand);
        this.eraseCommandStack = [];
    }

    private getLocalPos(e: FederatedPointerEvent): Position {
        const localPosition = this.currentView!.viewport.toLocal(new Point(e.global.x, e.global.y));
        return { x: localPosition.x, y: localPosition.y };
    }

    private reverseErase() {
        this.eraseCommandStack.reverse().forEach(cmd => cmd.undo(this.editorContext));
        this.eraseCommandStack = [];
    }
}