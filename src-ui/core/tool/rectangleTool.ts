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
    private startMouseCoordinate: Coordinate = null!;
    private currentMouseCoordinate: Coordinate = null!;

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
        this.startMouseCoordinate = null!;
        this.currentMouseCoordinate = null!;
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
        this.startMouseCoordinate = null!;
        this.currentMouseCoordinate = null!;
        this.targetLayer = null;
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (!this.currentSession || e.button !== 0 || !this.targetLayer || !this.activeDrawStrategy) return;

        this.isDragging = true;
        this.startMouseCoordinate = this.getGridCoordinates(e.global.x, e.global.y);
        this.currentMouseCoordinate = this.startMouseCoordinate;
        this.updateDrawPayload(e.shiftKey);
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentSession || !this.isDragging || !this.startMouseCoordinate) return;
        
        const newPos = this.getGridCoordinates(e.global.x, e.global.y);
        if (this.currentMouseCoordinate?.col !== newPos.col || this.currentMouseCoordinate?.row !== newPos.row) {
            this.currentMouseCoordinate = newPos;
            this.updateDrawPayload(e.shiftKey);
        }
    }

    private onPointerUp(e: FederatedPointerEvent): void {
        if (!this.currentSession || !this.isDragging) return;

        const historyManager = this.editorContext.getCurrentHistoryManager();

        if (historyManager && this.activeDrawStrategy && this.targetLayer && this.drawPayloads.size > 0) {
            this.activeDrawStrategy.commit(this.targetLayer, Array.from(this.drawPayloads.values()), this.editorContext);
        }

        this.clearDrawPreview();

        this.isDragging = false;
        this.startMouseCoordinate = null!;
        this.currentMouseCoordinate = null!;
    }

    private getBounds(start: Coordinate, current: Coordinate, isSquare: boolean) {
        let minX = Math.min(start.col, current.col);
        let maxX = Math.max(start.col, current.col);
        let minY = Math.min(start.row, current.row);
        let maxY = Math.max(start.row, current.row);

        if (isSquare) {
            const dx = current.col - start.col;
            const dy = current.row - start.row;
            const size = Math.max(Math.abs(dx), Math.abs(dy));

            maxX = start.col + (dx >= 0 ? size : -size);
            maxY = start.row + (dy >= 0 ? size : -size);

            minX = Math.min(start.col, maxX);
            maxX = Math.max(start.col, maxX);
            minY = Math.min(start.row, maxY);
            maxY = Math.max(start.row, maxY);
        }

        return { minX, maxX, minY, maxY };
    }

    private getDrawCoordinates(bounds: { minX: number, maxX: number, minY: number, maxY: number }): Coordinate[] {
        const points: Coordinate[] = [];
        const { minX, maxX, minY, maxY } = bounds;

        let size = this.activeDrawStrategy!.getBrushSize(this.editorContext);

        const width = Math.ceil(Math.abs(maxX - minX + 1) / size.width);
        const height = Math.ceil(Math.abs(maxY - minY + 1) / size.height);

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const col = minX + x * size.width;
                const row = minY + y * size.height;
                points.push({ col, row });
            }
        }
        return points;
    }

    private updateDrawPayload(shiftKey: boolean): void {
        if (!this.activeDrawStrategy || !this.currentSession || !this.overlayContainer || !this.startMouseCoordinate || !this.currentMouseCoordinate) return;

        this.clearDrawPreview();

        const bounds = this.getBounds(this.startMouseCoordinate, this.currentMouseCoordinate, shiftKey);
        const drawCoordinates = this.getDrawCoordinates(bounds);

        drawCoordinates.forEach((drawCoordinate) => {
            const data = this.activeDrawStrategy!.getPayload(drawCoordinate, this.editorContext, this.currentSession!);
            if (data.length <= 0) return;
            data.forEach((stampData) => {
                if (stampData.coordinate.col > bounds.maxX || stampData.coordinate.row > bounds.maxY) {
                    stampData.sprite.destroy();
                    return;
                }
                const key = `${stampData.coordinate.col},${stampData.coordinate.row}`;
                if (this.drawPayloads.has(key)) this.drawPayloads.get(key)!.sprite.destroy();
                // TODO: Use coordToPos from BaseLayer
                stampData.sprite.position.set(stampData.coordinate.col * this.currentSession!.tilemap.tilewidth, stampData.coordinate.row * this.currentSession!.tilemap.tileheight);
                this.overlayContainer!.addChild(stampData.sprite);
                this.drawPayloads.set(key, stampData);
            });
        });
    }

    // TODO: Use coordToPos from BaseLayer
    private getGridCoordinates(globalX: number, globalY: number): Coordinate {
        const worldPos = this.currentSession!.sessionView.viewport.toLocal(new Point(globalX, globalY));
        const gridX = Math.floor(worldPos.x / this.currentSession!.tilemap.tilewidth);
        const gridY = Math.floor(worldPos.y / this.currentSession!.tilemap.tileheight);
        return { col: gridX, row: gridY };
    }

    private updateActiveDrawStrategy(): void {
        if (!this.currentSession) return;

        const selectedIds = this.currentSession.layerState.selectedLayers;
        if (selectedIds.length === 0) return;

        this.targetLayer = null;

        for (const id of selectedIds) {
            const layer = this.currentSession.tilemap.rootLayer.findLayer(id);
            if (layer && !(layer instanceof GroupLayer)) {
                this.targetLayer = layer;
                break;
            }
        }

        if (!this.targetLayer || this.targetLayer.locked || !this.targetLayer.visible) {
            this.activeDrawStrategy = null;
            return;
        }

        if (!this.targetLayer) return;

        this.activeDrawStrategy = this.drawStrategys.find(s => s.canHandle(this.targetLayer!)) || null;
    }

    private clearDrawPreview(): void {
        this.drawPayloads.forEach((data) => data.sprite.destroy());
        this.drawPayloads.clear();
    }
}