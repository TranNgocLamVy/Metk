import { Container, FederatedPointerEvent, Point, Sprite } from "pixi.js";
import { IDrawStrategy, DrawPayload } from "./drawStrategy/IDrawStrategy";
import { ITool } from "@/core/interface/ITool";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { DrawTileStrategy } from "./drawStrategy/drawTileStrategy";
import { DrawRuleStrategy } from "./drawStrategy/drawRuleStrategy";
import { EditorContext } from "@/core/application/editorContext";
import { Tool } from "@/core/decorator/tool";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "../application/tile/layer/groupLayer";

import icon from "@/assets/icons/ruler.svg?raw";
import { GeometryUtils } from "@/shared/utils/geometryUtils";

@Tool({
    id: "tool.line",
    name: "Line",
    displayOnToolbar: {
        icon: icon,
        tooltip: "Line",
        index: 1,
    },
    shortcuts: ["L"],
})
export class LineTool implements ITool {
    private drawStrategys: IDrawStrategy[];
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentSession: TilemapSession | null = null;
    private overlayContainer: Container | null = null;

    private startMouseCoordinate: Coordinate = null!;
    private currentMouseCoordinate: Coordinate = null!;
    private isDragging: boolean = false;

    private hoverSprites: Sprite[] = [];
    private drawPayloads: Map<string, DrawPayload> = new Map();

    private targetLayer: BaseLayer<any> | null = null;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;
    private bindOnSelectedLayersChanged: () => void;

    constructor(private readonly editorContext: EditorContext) {
        this.drawStrategys = [
            new DrawTileStrategy(),
            new DrawRuleStrategy()
        ];

        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
        this.bindOnSelectedLayersChanged = this.updateActiveDrawStrategy.bind(this);
    }

    public onEnable(): void {
        this.drawPayloads = new Map<string, DrawPayload>();
    }

    public onDisable(): void {
        this.clearDrawPreview();
        this.clearHoverPreview();

        this.isDragging = false;
        this.startMouseCoordinate = null!;
        this.currentMouseCoordinate = null!;
    }

    public attach(session: TilemapSession): void {
        this.currentSession = session;
        const viewport = session.sessionView.viewport;
        this.overlayContainer = session.sessionView.overlayerContainer;

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
        viewport.addEventListener("mouseleave", this.bindPointerOutside);

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
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        this.currentSession.eventEmitter.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
        this.currentSession = null;

        this.overlayContainer = null;

        this.clearHoverPreview();

        this.clearDrawPreview();

        this.isDragging = false;
        this.startMouseCoordinate = null!;
        this.currentMouseCoordinate = null!;
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (!this.currentSession || e.button !== 0 || !this.targetLayer || !this.activeDrawStrategy) return;

        this.isDragging = true;
        this.startMouseCoordinate = this.getGridCoordinates(e.global.x, e.global.y);
        this.currentMouseCoordinate = this.startMouseCoordinate;
        this.updateDrawPayload();
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        const newPos = this.getGridCoordinates(e.global.x, e.global.y);
        if (!this.currentSession || !this.isDragging || !this.startMouseCoordinate) {
            this.clearDrawPreview();
            this.drawHoverPreview(newPos);
            return;
        }

        if (this.currentMouseCoordinate?.col !== newPos.col || this.currentMouseCoordinate?.row !== newPos.row) {
            this.currentMouseCoordinate = newPos;
            this.updateDrawPayload();
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

    private onPointerOutside(e: FederatedPointerEvent) {
        this.clearDrawPreview();
    }

    private drawHoverPreview(coordinate: Coordinate) {
        this.clearHoverPreview();

        if (!this.currentSession || !this.overlayContainer) return;

        if (this.activeDrawStrategy) {
            this.hoverSprites = this.activeDrawStrategy.drawHoverPreview(coordinate, this.editorContext, this.currentSession, this.overlayContainer);
        }
    }

    private updateDrawPayload(): void {
        this.clearDrawPreview();

        if (!this.activeDrawStrategy || !this.currentSession || !this.overlayContainer || !this.startMouseCoordinate || !this.currentMouseCoordinate) return;

        const drawCoordinates = GeometryUtils.calculateLine(this.startMouseCoordinate, this.currentMouseCoordinate);

        drawCoordinates.forEach((drawCoordinate) => {
            const data = this.activeDrawStrategy!.getPayload(drawCoordinate, this.editorContext, this.currentSession!);
            if (data.length <= 0) return;
            data.forEach((stampData) => {
                const key = `${stampData.coordinate.col},${stampData.coordinate.row}`;
                if (this.drawPayloads.has(key)) this.drawPayloads.get(key)!.sprite.destroy();
                // TODO: Use coordToPos from BaseLayer
                stampData.sprite.position.set(stampData.coordinate.col * this.currentSession!.tilemap.tilewidth, stampData.coordinate.row * this.currentSession!.tilemap.tileheight);
                this.overlayContainer!.addChild(stampData.sprite);
                this.drawPayloads.set(key, stampData);
            });
        });
    }

    // TODO: Use posToCoord from BaseLayer
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

    private clearHoverPreview() {
        this.hoverSprites.forEach(sprite => sprite.destroy());
        this.hoverSprites = [];
    }
}