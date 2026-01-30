import { Stamp } from "lucide-react";
import { Container, FederatedPointerEvent, Point, Sprite } from "pixi.js";
import React from "react";

import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { TileLayer } from "../application/tile/layer/tileLayer";
import { Tile } from "../application/tile/tileset";
import { SetTileCommand } from "../command/tile/setTileCommand";
import { Tool } from "../decorator/tool";
import { ITool } from "../interface/ITool";

type PreviewSpriteData = {
    sprite: Sprite;
    tileId: number;
    tilesetId: string;
}

@Tool({
    id: "stamp",
    name: "Stamp Brush",
    displayOnToolbar: {
        icon: React.createElement(Stamp),
        tooltip: "Stamp Brush",
        index: 0,
    },
    shortcuts: ["B"],
})
export class StampBrush implements ITool {
    private currentSession: TilemapSession | null = null;
    private overlayContainer: Container | null = null;


    private previousPreviewCoordinate: Coordinate = null!;
    private currentPreviewCoordinate: Coordinate = null!;
    private previewSprites: Sprite[] = [];

    private isDragging: boolean = false;
    private previewSpriteMap: Map<string, PreviewSpriteData>;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;

    constructor(private readonly editorContext: EditorContext) {
        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
    }

    public onEnable(): void {
        this.previewSpriteMap = new Map<string, PreviewSpriteData>();
    }


    public onDisable(): void {
        this.previewSpriteMap.forEach((spriteData) => this.overlayContainer!.removeChild(spriteData.sprite));
        this.previewSpriteMap = new Map<string, PreviewSpriteData>();
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
    }

    public detach(): void {
        if (!this.currentSession) return;
        const viewport = this.currentSession.sessionView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        this.currentSession = null;

        if (this.overlayContainer) this.overlayContainer.removeChildren();
        this.overlayContainer = null;
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (!this.currentSession) return;
        if (e.button !== 0) return;
        if (!this.getActiveTileLayer()) return;
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
        if (!this.currentSession) return;
        if (!this.isDragging) return;
        this.isDragging = false;
        this.stampEnd(e);
    }

    private onPointerOutside(e: FederatedPointerEvent) {
        if (this.overlayContainer) {
            this.previewSprites.forEach(sprite => this.overlayContainer!.removeChild(sprite));
        }
    }

    private drawPreviewTiles() {
        const selectedTiles = this.getSelectedTiles();
        const activeLayer = this.getActiveTileLayer();

        if (!selectedTiles || !activeLayer) return;

        if (this.overlayContainer) {
            this.previewSprites.forEach(sprite => this.overlayContainer!.removeChild(sprite));
        }

        this.previewSprites = [];

        for (let r = 0; r < selectedTiles.length; r++) {
            const rowTiles = selectedTiles[r];
            for (let c = 0; c < rowTiles.length; c++) {
                const tile = rowTiles[c];
                if (!tile) continue;
                const col = this.currentPreviewCoordinate!.col + c;
                const row = this.currentPreviewCoordinate!.row + r;
                if (col < 0 || col >= this.currentSession!.tilemap.width ||
                    row < 0 || row >= this.currentSession!.tilemap.height) continue;

                const sprite = new Sprite(tile.getTexture());
                sprite.position.set(col * this.currentSession!.tilemap.tilewidth, row * this.currentSession!.tilemap.tileheight);
                this.overlayContainer!.addChild(sprite);
                this.previewSprites.push(sprite);
            }
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

    private getActiveTileLayer(): TileLayer | null {
        const selectedIds = this.currentSession!.layerState.selectedLayers;
        if (selectedIds.length == 0) return null;

        const activeId = selectedIds.values().next().value;
        if (!activeId) return null;

        const root = this.currentSession!.tilemap.rootLayer;
        const layer = root.findLayer(activeId);

        if (layer && layer instanceof TileLayer) return layer;
        return null;
    }

    private getSelectedTiles(): (Tile | null)[][] | null {
        const selection = this.editorContext.getSelectedTile();
        const pivot = this.editorContext.getPivot();
        if (!selection || !pivot) return null;
        return selection;
    }

    private stampMove(e: FederatedPointerEvent) {
        if (!this.isDragging) return;

        const drawCoordinates = this.getDrawCoordinates();

        if (drawCoordinates.length == 0) drawCoordinates.push(this.currentPreviewCoordinate);

        drawCoordinates.forEach(drawCoordinate => {
            const tiles = this.getSelectedTiles();
            if (!tiles || !tiles.length) return;

            for (let r = 0; r < tiles.length; r++) {
                const row = tiles[r];
                for (let c = 0; c < row.length; c++) {
                    const tile = row[c];

                    const targetX = drawCoordinate.col + c;
                    const targetY = drawCoordinate.row + r;
                    if (targetX < 0 || targetX >= this.currentSession!.tilemap.width ||
                        targetY < 0 || targetY >= this.currentSession!.tilemap.height) {
                        continue;
                    }

                    if (!tile) continue;
                    const tileTexture = tile.getTexture();

                    const key = `${targetX},${targetY}`;
                    let tileSpriteData: PreviewSpriteData;
                    if (this.previewSpriteMap.has(key)) {
                        tileSpriteData = this.previewSpriteMap.get(key)!;
                        tileSpriteData.sprite.texture = tileTexture;
                        tileSpriteData.tileId = tile.id;
                        tileSpriteData.tilesetId = tile.tileset.id;
                    } else {
                        tileSpriteData = {
                            sprite: new Sprite(tileTexture),
                            tileId: tile.id,
                            tilesetId: tile.tileset.id,
                        }
                        this.previewSpriteMap.set(key, tileSpriteData);
                        this.overlayContainer!.addChild(tileSpriteData.sprite);
                    }
                    tileSpriteData.sprite.position.set(targetX * this.currentSession!.tilemap.tilewidth, targetY * this.currentSession!.tilemap.tileheight);
                }
            }
        })

        this.previousPreviewCoordinate = this.currentPreviewCoordinate;
    }

    private stampEnd(e: FederatedPointerEvent) {
        const historyManager = this.editorContext.getCurrentHistoryManager();
        if (!historyManager) {
            this.previewSpriteMap.forEach((spriteData) => {
                this.overlayContainer!.removeChild(spriteData.sprite);
            });
            this.previewSpriteMap.clear();
            return;
        }

        const targetLayer = this.getActiveTileLayer();
        if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

        historyManager.startTransaction();
        this.previewSpriteMap.forEach((spriteData, key) => {
            const col = parseInt(key.split(',')[0]);
            const row = parseInt(key.split(',')[1]);
            const setTileCommand = new SetTileCommand(targetLayer.id, { col, row }, spriteData.tileId, spriteData.tilesetId);
            historyManager.execute(setTileCommand, this.editorContext);
        })
        historyManager.commitTransaction();

        this.previewSpriteMap.forEach((spriteData) => {
            this.overlayContainer!.removeChild(spriteData.sprite);
        });
        this.previewSpriteMap.clear();
    }
}