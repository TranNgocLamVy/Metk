import { Container, FederatedPointerEvent, Point } from "pixi.js";
import { IDrawStrategy, DrawPayload } from "./drawStrategy/IDrawStrategy";
import { ITool } from "@/core/interface/ITool";
import { EditorContext } from "@/core/application/editorContext";
import { Tool } from "@/core/decorator/tool";

import icon from "@/assets/icons/rect.svg?raw";
import { TilemapView } from "../application/view/tilemapView";
import { BaseLayerRenderer } from "../application/renderer/baseLayerRenderer";

@Tool({
    id: "tool.rectangle",
    label: "workspace.tool.rectangle.label",
    displayOnToolbar: {
        icon: icon,
        tooltip: "workspace.tool.rectangle.description",
        index: 2,
    },
    shortcuts: ["R"],
    when: "inWorkspace && !isModalOpen",
})
export class RectangleTool implements ITool {
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentView: TilemapView | null = null;

    private overlayContainer: Container | null = null;

    private isDragging: boolean = false;
    private startMousePosition: Position = null!;
    private previousMousePosition: Position = null!;
    private currentMousePosition: Position = null!;

    private drawPayloads: Map<string, DrawPayload> = new Map();

    private targetLayerRenderer: BaseLayerRenderer | null = null;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;

    constructor(private readonly editorContext: EditorContext) {
        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
    }

    public onEnable(): void {
        this.drawPayloads = new Map<string, DrawPayload>();
    }

    public onDisable(): void {
        this.clearDrawPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.currentMousePosition = null!;
        this.targetLayerRenderer = null;
    }

    public attachView(view: TilemapView): void {
        this.currentView = view;

        const viewport = this.currentView.viewport;
        this.overlayContainer = this.currentView.overlayerContainer;

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
    }

    public detach(): void {
        if (!this.currentView) return;
        const viewport = this.currentView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);

        this.currentView = null;

        this.overlayContainer = null;

        this.clearDrawPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.currentMousePosition = null!;
        this.targetLayerRenderer = null;
    }

    public setDrawStrategy(strategy: IDrawStrategy | null): void {
        this.activeDrawStrategy = strategy;
    }

    public setTargetLayerRenderer(layerRenderer: BaseLayerRenderer | null): void {
        this.targetLayerRenderer = layerRenderer;
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (!this.currentView || e.button !== 0 || !this.targetLayerRenderer || !this.activeDrawStrategy) return;

        this.isDragging = true;
        this.currentMousePosition = this.startMousePosition = this.previousMousePosition = this.getLocalPos(e);
        this.updateDrawPayload(e.shiftKey);
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.activeDrawStrategy || !this.targetLayerRenderer) return;

        const newMousePosition = this.getLocalPos(e);
        this.previousMousePosition = { ...this.currentMousePosition };
        this.currentMousePosition = newMousePosition;

        if (this.activeDrawStrategy.comparePosition(this.previousMousePosition, newMousePosition, this.targetLayerRenderer)) return;

        this.updateDrawPayload(e.shiftKey);
    }

    private onPointerUp(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.isDragging) return;

        const historyManager = this.editorContext.getCurrentHistoryManager();

        if (historyManager && this.activeDrawStrategy && this.targetLayerRenderer && this.drawPayloads.size > 0) {
            this.activeDrawStrategy.commit(this.targetLayerRenderer, Array.from(this.drawPayloads.values()), this.editorContext);
        }

        this.clearDrawPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.currentMousePosition = null!;
    }

    private updateDrawPayload(shiftKey: boolean): void {
        if (!this.activeDrawStrategy || !this.currentView || !this.overlayContainer || !this.startMousePosition || !this.currentMousePosition) return;

        this.clearDrawPreview();

        const { boundary, drawPositions } = this.calculateDrawPositions(this.startMousePosition, this.currentMousePosition, shiftKey);

        drawPositions.forEach((drawPosition) => {
            const drawPayloads = this.activeDrawStrategy!.getPayload(drawPosition, this.targetLayerRenderer!, this.editorContext, this.currentView!.session);
            if (drawPayloads.length <= 0) return;
            drawPayloads.forEach((drawPayload) => {
                if (drawPayload.coordinate.col > boundary.maxX || drawPayload.coordinate.row > boundary.maxY) {
                    drawPayload.sprite.destroy();
                    return;
                }
                if (this.drawPayloads.has(drawPayload.key)) this.drawPayloads.get(drawPayload.key)!.sprite.destroy();
                this.overlayContainer!.addChild(drawPayload.sprite);
                this.drawPayloads.set(drawPayload.key, drawPayload);
            });
        });
    }

    private calculateDrawPositions(start: Position, end: Position, isSquare: boolean) {
        // TODO: Handle special case for ObjectLayer
        const startCoord = this.targetLayerRenderer!.posToCoord(start);
        const endCoord = this.targetLayerRenderer!.posToCoord(end);

        let minX = Math.min(startCoord.col, endCoord.col);
        let maxX = Math.max(startCoord.col, endCoord.col);
        let minY = Math.min(startCoord.row, endCoord.row);
        let maxY = Math.max(startCoord.row, endCoord.row);

        if (isSquare) {
            const dx = endCoord.col - startCoord.col;
            const dy = endCoord.row - startCoord.row;
            const size = Math.max(Math.abs(dx), Math.abs(dy));

            maxX = startCoord.col + (dx >= 0 ? size : -size);
            maxY = startCoord.row + (dy >= 0 ? size : -size);

            minX = Math.min(startCoord.col, maxX);
            maxX = Math.max(startCoord.col, maxX);
            minY = Math.min(startCoord.row, maxY);
            maxY = Math.max(startCoord.row, maxY);
        }

        const size = this.activeDrawStrategy!.getBrushSize(this.editorContext);

        const width = Math.ceil(Math.abs(maxX - minX + 1) / size.width);
        const height = Math.ceil(Math.abs(maxY - minY + 1) / size.height);

        const drawPositions: Position[] = [];

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const col = minX + x * size.width;
                const row = minY + y * size.height;
                drawPositions.push(this.targetLayerRenderer!.coordToPos({ col, row }));
            }
        }

        return { boundary: { minX, maxX, minY, maxY }, drawPositions };
    }

    private getLocalPos(e: FederatedPointerEvent): Position {
        const localPosition = this.currentView!.viewport.toLocal(new Point(e.global.x, e.global.y));
        return { x: localPosition.x, y: localPosition.y };
    }
    
    private clearDrawPreview(): void {
        this.drawPayloads.forEach((data) => data.sprite.destroy());
        this.drawPayloads.clear();
    }
}