import { EventEmitter } from "eventemitter3";
import { Viewport } from "pixi-viewport";
import { FederatedPointerEvent, Point } from "pixi.js";

import { AppCore } from "@/core/appcore";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";
import { Tile } from "@/core/application/tile/tileset";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { SetTileCommand } from "../command/tile/setTileCommand";

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
        const editoContext = AppCore.getIns().editorContext;
        const selection = editoContext.getSelectedTile();
        const pivot = editoContext.getPivot();
        if (!selection || !pivot) return null;
        return { tiles: selection, pivot };
    }

    private paint(globalX: number, globalY: number) {
        const editorContext = AppCore.getIns().editorContext;
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!historyManager) return;
        
        const targetLayer = this.getActiveTileLayer();
        if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;


        const { x: gx, y: gy } = this.getGridCoordinates(globalX, globalY);

        const selection = this.getSelectedTiles();

        if (!selection) return;

        const { tiles } = selection;
        if (!tiles.length) return;

        const pivotX = Math.floor(tiles.length / 2)
        const pivotY = Math.floor(tiles[0].length / 2)

        for (let r = 0; r < tiles.length; r++) {
            const row = tiles[r];
            for (let c = 0; c < row.length; c++) {
                const tile = row[c];

                const targetX = gx + c - pivotX;
                const targetY = gy + r - pivotY;                
                if (targetX < 0 || targetX >= this.tilemap.width || 
                    targetY < 0 || targetY >= this.tilemap.height) {
                    continue;
                }

                if (tile) {
                    const setTileCommand = new SetTileCommand(targetLayer.id, { col: targetX, row: targetY }, tile);
                    const result = historyManager.execute(setTileCommand, AppCore.getIns().editorContext);
                }
            }
        }
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (e.button !== 0) return; // Left click only
        const editorContext = AppCore.getIns().editorContext;
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!historyManager) return;
        historyManager.startTransaction();
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
        const editorContext = AppCore.getIns().editorContext;
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!historyManager) return;
        historyManager.commitTransaction();
    }
}