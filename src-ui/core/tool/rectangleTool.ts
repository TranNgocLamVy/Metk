import { Container, FederatedPointerEvent, Point } from "pixi.js";
import { IDrawStrategy, DrawPayload } from "./drawStrategy/IDrawStrategy";
import { ITool } from "@/core/interface/ITool";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { DrawTileStrategy } from "./drawStrategy/drawTileStrategy";
import { DrawRuleStrategy } from "./drawStrategy/drawRuleStrategy";
import { EditorContext } from "@/core/application/editorContext";
import { Tool } from "@/core/decorator/tool";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "../application/tile/layer/groupLayer";

import icon from "@/assets/icons/rect.svg?raw";

@Tool({
    id: "tool.rectangle",
    name: "Rectangle",
    displayOnToolbar: {
        icon: icon,
        tooltip: "Rectangle",
        index: 2,
    },
    shortcuts: ["R"],
})
export class RectangleTool implements ITool {
    private drawStrategys: IDrawStrategy[] = [];
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentSession: TilemapSession | null = null;
    private overlayContainer: Container | null = null;

    private isDragging: boolean = false;
    private startMousePosition: Position = null!;
    private previousMousePosition: Position = null!;
    private currentMousePosition: Position = null!;

    private drawPayloads: Map<string, DrawPayload> = new Map();

    private targetLayer: BaseLayer<any> | null = null;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindOnSelectedLayersChanged: () => void;

    constructor(private readonly editorContext: EditorContext) {
        this.drawStrategys = [
            new DrawTileStrategy(),
            new DrawRuleStrategy()
        ];

        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindOnSelectedLayersChanged = this.updateActiveDrawStrategy.bind(this);
    }

    public onEnable(): void {
        this.drawPayloads = new Map<string, DrawPayload>();
    }

    public onDisable(): void {
        this.clearDrawPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.currentMousePosition = null!;
        this.targetLayer = null;
    }

    public attach(session: TilemapSession): void {
        this.currentSession = session;
        const viewport = session.sessionView.viewport;
        this.overlayContainer = session.sessionView.overlayerContainer;

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);

        this.updateActiveDrawStrategy();
        this.currentSession.eventEmitter.on("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
    }

    public detach(): void {
        if (!this.currentSession) return;
        const viewport = this.currentSession.sessionView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);

        this.currentSession.eventEmitter.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
        this.currentSession = null;

        this.overlayContainer = null;

        this.clearDrawPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.currentMousePosition = null!;
        this.targetLayer = null;
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (!this.currentSession || e.button !== 0 || !this.targetLayer || !this.activeDrawStrategy) return;

        this.isDragging = true;
        this.currentMousePosition = this.startMousePosition = this.previousMousePosition = this.getLocalPos(e);
        this.updateDrawPayload(e.shiftKey);
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentSession || !this.activeDrawStrategy || !this.targetLayer) return;

        const newMousePosition = this.getLocalPos(e);
        this.previousMousePosition = { ...this.currentMousePosition };
        this.currentMousePosition = newMousePosition;

        if (this.activeDrawStrategy.comparePosition(this.previousMousePosition, newMousePosition, this.targetLayer)) return;

        this.updateDrawPayload(e.shiftKey);
    }

    private onPointerUp(e: FederatedPointerEvent): void {
        if (!this.currentSession || !this.isDragging) return;

        const historyManager = this.editorContext.getCurrentHistoryManager();

        if (historyManager && this.activeDrawStrategy && this.targetLayer && this.drawPayloads.size > 0) {
            this.activeDrawStrategy.commit(this.targetLayer, Array.from(this.drawPayloads.values()), this.editorContext);
        }

        this.clearDrawPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.currentMousePosition = null!;
    }

    private updateDrawPayload(shiftKey: boolean): void {
        if (!this.activeDrawStrategy || !this.currentSession || !this.overlayContainer || !this.startMousePosition || !this.currentMousePosition) return;

        this.clearDrawPreview();

        const { boundary, drawPositions } = this.calculateDrawPositions(this.startMousePosition, this.currentMousePosition, shiftKey);

        drawPositions.forEach((drawPosition) => {
            const drawPayloads = this.activeDrawStrategy!.getPayload(drawPosition, this.targetLayer!, this.editorContext, this.currentSession!);
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
        const startCoord = this.targetLayer!.posToCoord(start);
        const endCoord = this.targetLayer!.posToCoord(end);

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
                drawPositions.push(this.targetLayer!.coordToPos({ col, row }));
            }
        }

        return { boundary: { minX, maxX, minY, maxY }, drawPositions };
    }

    private updateActiveDrawStrategy(): void {
        if (!this.currentSession) return;
        
        this.targetLayer = null;
        this.activeDrawStrategy = null;

        const selectedIds = this.currentSession.layerState.selectedLayers;
        if (selectedIds.length === 0) return;


        let targetLayer: BaseLayer<any> | null = null;
        for (const id of selectedIds) {
            const layer = this.currentSession.tilemap.rootLayer.findLayer(id);
            if (layer && !(layer instanceof GroupLayer)) {
                targetLayer = layer;
                break;
            }
        }

        if (!targetLayer || targetLayer?.locked || !targetLayer?.visible) return;

        this.activeDrawStrategy = this.drawStrategys.find(s => s.canHandle(targetLayer!, this)) || null;
        if (!this.activeDrawStrategy) return;
        this.targetLayer = targetLayer;
    }

    private getLocalPos(e: FederatedPointerEvent): Position {
        const localPosition = this.currentSession!.sessionView.viewport.toLocal(new Point(e.global.x, e.global.y));
        return { x: localPosition.x, y: localPosition.y };
    }
    
    private clearDrawPreview(): void {
        this.drawPayloads.forEach((data) => data.sprite.destroy());
        this.drawPayloads.clear();
    }
}