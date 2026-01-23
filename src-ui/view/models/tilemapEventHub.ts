import EventEmitter from "events";
import { Viewport } from "pixi-viewport";
import { FederatedPointerEvent, Point } from "pixi.js";

import { AppCore } from "@/core/appcore";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";
import { Tile } from "@/core/application/tile/tileset";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

export class TilemapEventHub extends EventEmitter {
    private viewport: Viewport;
    private tilemap: Tilemap;
    
    private isDrawing: boolean = false;

    private bindOnPointerDown: (event: FederatedPointerEvent) => void
    private bindOnPointerMove: (event: FederatedPointerEvent) => void
    private bindOnPointerUp: (event: FederatedPointerEvent) => void

    constructor(viewport: Viewport, tilemap: Tilemap) {
        super();
        this.viewport = viewport;
        this.tilemap = tilemap;

        this.bindOnPointerDown = this.onPointerDown.bind(this);
        this.bindOnPointerMove = this.onPointerMove.bind(this);
        this.bindOnPointerUp = this.onPointerUp.bind(this);

        this.attachListeners();
    }

    private attachListeners() {
        this.viewport.on("pointerdown", this.bindOnPointerDown);
        this.viewport.on("pointermove", this.bindOnPointerMove);
        this.viewport.on("pointerup", this.bindOnPointerUp);
        this.viewport.on("pointerupoutside", this.bindOnPointerUp);
    }

    public destroy() {
        this.viewport.off("pointerdown", this.bindOnPointerDown);
        this.viewport.off("pointermove", this.bindOnPointerMove);
        this.viewport.off("pointerup", this.bindOnPointerUp);
        this.viewport.off("pointerupoutside", this.bindOnPointerUp);
        this.removeAllListeners();
    }

    private getGridCoordinates(globalX: number, globalY: number): { x: number, y: number } {
        const worldPos = this.viewport.toLocal(new Point(globalX, globalY));
        const gridX = Math.floor(worldPos.x / this.tilemap.tilewidth);
        const gridY = Math.floor(worldPos.y / this.tilemap.tileheight);
        return { x: gridX, y: gridY };
    }

    private getActiveTileLayer(): TileLayer | null {
        const { selectedIds, currentSession } = useLayerManagerStore.getState();
        if (selectedIds.length == 0 || !currentSession) return null;

        const activeId = selectedIds.values().next().value;
        if (!activeId) return null;

        const root = currentSession.tilemap.rootLayer;
        const layer = root.findLayer(activeId);

        if (layer && layer instanceof TileLayer) {
            return layer;
        }
        return null;
    }

    private getSelectedTiles(): { tiles: (Tile | null)[][], pivot: Coordinate } | null {
        // Access the Tileset Session Store to get the active brush
        const tileSetSession = AppCore.getIns().editorContext.getCurrentTilesetSession();

        if (!tileSetSession || !tileSetSession.tileset) return null;

        const tiles = tileSetSession.getSelectedTiles();
        const pivot = tileSetSession.getPivot();

        if (!tiles || !pivot) return null;

        return { tiles, pivot };
    }

    private paint(globalX: number, globalY: number) {
        const targetLayer = this.getActiveTileLayer();
        if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

        const { x: gx, y: gy } = this.getGridCoordinates(globalX, globalY);

        const selection = this.getSelectedTiles();
        if (!selection) return;

        const { tiles, pivot } = selection;
        if (!tiles.length) return;

        let relPivotCol = Math.floor((tiles[0].length - 1) / 2);
        let relPivotRow = Math.floor((tiles.length - 1) / 2);

        let foundRef = false;
        for(let r = 0; r < tiles.length; r++) {
            for(let c = 0; c < tiles[r].length; c++) {
                const tile = tiles[r][c];
                if (tile) {
                    const columns = tile.tileset.columns;
                    const absCol = tile.id % columns;
                    const absRow = Math.floor(tile.id / columns);

                    const minC = absCol - c;
                    const minR = absRow - r;

                    relPivotCol = pivot.col - minC;
                    relPivotRow = pivot.row - minR;
                    
                    foundRef = true;
                    break;
                }
            }
            if (foundRef) break;
        }

        // 2. Paint Tiles
        for (let r = 0; r < tiles.length; r++) {
            const row = tiles[r];
            for (let c = 0; c < row.length; c++) {
                const tile = row[c];
                
                const targetX = gx + (c - relPivotCol);
                const targetY = gy + (r - relPivotRow);

                // Boundary check
                if (targetX < 0 || targetX >= this.tilemap.width || 
                    targetY < 0 || targetY >= this.tilemap.height) {
                    continue;
                }

                if (tile) {
                    // TODO: Implement Command Manager for Undo/Redo
                    console.log("paint", targetX, targetY, tile);
                    targetLayer.setTileRefAt({ x: targetX, y: targetY }, tile);
                }
            }
        }
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (e.button !== 0) return; // Left click only
        this.isDrawing = true;
        this.paint(e.global.x, e.global.y);
    }

    private onPointerMove(e: FederatedPointerEvent) {
        if (!this.isDrawing) return;
        this.paint(e.global.x, e.global.y);
    }

    private onPointerUp(e: FederatedPointerEvent) {
        if (this.isDrawing) {
            this.isDrawing = false;
        }
    }
}