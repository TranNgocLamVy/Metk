import { Container, FederatedPointerEvent, Point, Sprite } from "pixi.js";

import stamp from "@/assets/icons/stamp.svg?raw";
import { IStamp, StampPreviewData } from "./stamp/IStamp";
import { ITool } from "@/core/interface/ITool";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { TileStamp } from "./stamp/tileStamp";
import { RuleStamp } from "./stamp/ruleStamp";
import { EditorContext } from "@/core/application/editorContext";
import { Tool } from "@/core/decorator/tool";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "../application/tile/layer/groupLayer";

@Tool({
    id: "stamp",
    name: "Stamp Brush",
    displayOnToolbar: {
        icon: stamp,
        tooltip: "Stamp Brush",
        index: 0,
    },
    shortcuts: ["B"],
})
export class StampBrush implements ITool {
    private stampTypes: IStamp[];
    private activeStamp: IStamp | null = null;

    private currentSession: TilemapSession | null = null;
    private overlayContainer: Container | null = null;

    private previousPreviewCoordinate: Coordinate = null!;
    private currentPreviewCoordinate: Coordinate = null!;
    private previewSprites: Sprite[] = [];

    private isDragging: boolean = false;
    private previewSpriteMap: Map<string, StampPreviewData> = new Map();

    private cachedTargetLayer: BaseLayer<any> | null = null;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;
    private bindOnSelectedLayersChanged: () => void;

    constructor(private readonly editorContext: EditorContext) {
        this.stampTypes = [
            new TileStamp(),
            new RuleStamp()
        ];

        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);

        this.bindOnSelectedLayersChanged = this.updateActiveStampType.bind(this);
    }

    public onEnable(): void {
        this.previewSpriteMap = new Map<string, StampPreviewData>();
    }

    public onDisable(): void {
        this.previewSpriteMap.forEach((spriteData) => spriteData.sprite.destroy());
        this.previewSpriteMap.clear();
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

        this.updateActiveStampType();
        
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

        if (this.overlayContainer) this.overlayContainer.children.forEach(child => child.destroy());
        this.overlayContainer = null;
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (!this.currentSession || e.button !== 0) return;

        if (!this.cachedTargetLayer || !this.activeStamp) return;

        this.isDragging = true;
        this.previousPreviewCoordinate = this.getGridCoordinates(e.global.x, e.global.y);
        this.stampMove(e);
    }

    private onPointerMove(e: FederatedPointerEvent) {
        if (!this.currentSession) return;

        const newCoordinate = this.getGridCoordinates(e.global.x, e.global.y);
        if (!this.currentPreviewCoordinate || this.currentPreviewCoordinate.col != newCoordinate.col || this.currentPreviewCoordinate.row != newCoordinate.row) {
            this.currentPreviewCoordinate = newCoordinate;
            this.drawPreviewTiles();
        }

        if (!this.isDragging) return;
        this.stampMove(e);
    }

    private onPointerUp(e: FederatedPointerEvent) {
        if (!this.currentSession || !this.isDragging) return;
        this.isDragging = false;
        this.stampEnd(e);
    }

    private onPointerOutside(e: FederatedPointerEvent) {
        if (this.overlayContainer) {
            this.previewSprites.forEach(sprite => sprite.destroy());
            this.previewSprites = [];
        }
    }

    private getGridCoordinates(globalX: number, globalY: number): Coordinate {
        const worldPos = this.currentSession!.sessionView.viewport.toLocal(new Point(globalX, globalY));
        const gridX = Math.floor(worldPos.x / this.currentSession!.tilemap.tilewidth);
        const gridY = Math.floor(worldPos.y / this.currentSession!.tilemap.tileheight);
        return { col: gridX, row: gridY };
    }

    private getDrawCoordinates(): Coordinate[] {
        const coordinates: Coordinate[] = [];
        if (!this.previousPreviewCoordinate || !this.currentPreviewCoordinate) return coordinates;

        let x0 = this.previousPreviewCoordinate.col;
        let y0 = this.previousPreviewCoordinate.row;
        const x1 = this.currentPreviewCoordinate.col;
        const y1 = this.currentPreviewCoordinate.row;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            coordinates.push({ col: x0, row: y0 });

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return coordinates;
    }

    private updateActiveStampType(): BaseLayer<any> | null {
        if (!this.currentSession) return null;

        const selectedIds = this.currentSession.layerState.selectedLayers;
        if (selectedIds.length === 0) return null; 
        
        this.cachedTargetLayer = null;

        for (const id of selectedIds) {
            const layer = this.currentSession.tilemap.rootLayer.findLayer(id);
            if (layer && !(layer instanceof GroupLayer)) {
                this.cachedTargetLayer = layer;
                break;
            }
        }
        
        if (!this.cachedTargetLayer || this.cachedTargetLayer.locked || !this.cachedTargetLayer.visible) {
            this.activeStamp = null;
            return null;
        }

        if (!this.cachedTargetLayer) return null;

        this.activeStamp = this.stampTypes.find(s => s.canHandle(this.cachedTargetLayer!)) || null;
        return this.cachedTargetLayer;
    }

    private drawPreviewTiles() {
        if (!this.currentSession || !this.overlayContainer) return;

        this.previewSprites.forEach(sprite => sprite.destroy());
        this.previewSprites = [];

        if (this.activeStamp && this.currentPreviewCoordinate) {
            this.previewSprites = this.activeStamp.drawHoverPreview(
                this.currentPreviewCoordinate,
                this.editorContext,
                this.currentSession,
                this.overlayContainer
            );
        }
    }

    private stampMove(e: FederatedPointerEvent) {
        if (!this.isDragging || !this.activeStamp || !this.currentSession || !this.overlayContainer) return;

        const drawCoordinates = this.getDrawCoordinates();
        if (drawCoordinates.length == 0) drawCoordinates.push(this.currentPreviewCoordinate);

        drawCoordinates.forEach(drawCoordinate => {
            this.activeStamp!.stampAt(
                drawCoordinate,
                this.editorContext,
                this.currentSession!,
                this.overlayContainer!,
                this.previewSpriteMap
            );
        });

        this.previousPreviewCoordinate = this.currentPreviewCoordinate;
    }

    private stampEnd(e: FederatedPointerEvent) {
        const historyManager = this.editorContext.getCurrentHistoryManager();


        if (historyManager && this.activeStamp && this.cachedTargetLayer) {
            this.activeStamp.commit(
                this.cachedTargetLayer,
                this.previewSpriteMap,
                this.editorContext,
                historyManager
            );
        }

        this.previewSpriteMap.forEach((data) => data.sprite.destroy());
        this.previewSpriteMap.clear();
    }
}