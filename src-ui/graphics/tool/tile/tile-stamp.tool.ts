import { SetTilesCommand } from "@/application/commands/tile/set-tiles.command";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tile } from "@/editor/model/tileset/tileset";
import { TileLayerRenderer } from "@/graphics/renderer/tilemap/tile-layer.renderer";
import { GridStrokeTool } from "@/graphics/tool/base/grid-stroke.tool";
import { Sprite } from "pixi.js";

type TilePreviewData = {
    key: string;
    coordinate: Coordinate;
    sprite: Sprite;
    tileId: number;
    tilesetId: string;
};

export class TileStampTool extends GridStrokeTool {
    private static readonly spriteAlpha = 0.9;

    private hoverSprites: Sprite[] = [];
    private strokePayloads: Map<string, TilePreviewData> = new Map();

    protected isTargetLayerSupported(layerRenderer: any): layerRenderer is TileLayerRenderer {
        return layerRenderer?.layer instanceof TileLayer;
    }

    protected clearHoverPreview(): void {
        this.hoverSprites.forEach((sprite) => sprite.destroy());
        this.hoverSprites = [];
    }

    protected clearStrokePreview(): void {
        this.strokePayloads.forEach((data) => data.sprite.destroy());
        this.strokePayloads.clear();
    }

    protected drawHoverPreview(coord: Coordinate): void {
        this.clearHoverPreview();
        if (!this.currentView || !this.overlayContainer || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;

        this.hoverSprites = this.createPreviewPayloads(coord).map((data) => {
            this.overlayContainer!.addChild(data.sprite);
            return data.sprite;
        });
    }

    protected collectStrokeAt(coord: Coordinate): void {
        if (!this.overlayContainer || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;

        this.createPreviewPayloads(coord).forEach((data) => {
            this.strokePayloads.get(data.key)?.sprite.destroy();
            this.overlayContainer!.addChild(data.sprite);
            this.strokePayloads.set(data.key, data);
        });
    }

    protected commitStroke(): void {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const historyManager = this.editorFacade.getCurrentHistoryManager();
        if (!historyManager || this.strokePayloads.size === 0) return;

        const updates = Array.from(this.strokePayloads.values()).map((data) => ({
            coordinate: data.coordinate,
            tileId: data.tileId,
            tilesetId: data.tilesetId,
        }));

        historyManager.startTransaction();
        historyManager.execute(
            new SetTilesCommand(this.targetLayerRenderer.tilemap.objectId, this.targetLayerRenderer.layer.objectId, updates),
            this.editorFacade,
        );
        historyManager.commitTransaction();
    }

    private createPreviewPayloads(origin: Coordinate): TilePreviewData[] {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return [];
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return [];

        const selectedTiles = this.getSelectedTiles();
        if (!selectedTiles) return [];

        const payloads: TilePreviewData[] = [];
        for (let r = 0; r < selectedTiles.length; r++) {
            const rowTiles = selectedTiles[r];
            for (let c = 0; c < rowTiles.length; c++) {
                const tile = rowTiles[c];
                if (!tile) continue;

                const coordinate = { col: origin.col + c, row: origin.row + r };
                if (!this.currentView.session.tilemap.isInBoundary(coordinate)) continue;

                const texture = this.editorFacade.textureManager.getTileTexture(tile.tileset.id, tile.id);
                if (!texture) continue;

                const sprite = new Sprite(texture);
                sprite.alpha = TileStampTool.spriteAlpha;

                const position = this.targetLayerRenderer.coordToPos(coordinate);
                sprite.position.set(
                    position.x,
                    position.y + (this.targetLayerRenderer.tilemap.tileHeight - texture.height),
                );

                payloads.push({
                    key: `${coordinate.col},${coordinate.row}`,
                    coordinate,
                    sprite,
                    tileId: tile.id,
                    tilesetId: tile.tileset.id,
                });
            }
        }

        return payloads;
    }

    private getSelectedTiles(): (Tile | null)[][] | null {
        const session = this.editorFacade.getActiveTilesetSession();
        if (!session || session.selectionState.selectedTilesSet.length === 0) return null;

        let minRow = Infinity;
        let maxRow = -Infinity;
        let minCol = Infinity;
        let maxCol = -Infinity;

        session.selectionState.selectedTilesSet.forEach((tileId) => {
            const coordinate = session.tileset.getCoordinatesFromTile(tileId);
            if (!coordinate) return;
            minRow = Math.min(minRow, coordinate.row);
            maxRow = Math.max(maxRow, coordinate.row);
            minCol = Math.min(minCol, coordinate.col);
            maxCol = Math.max(maxCol, coordinate.col);
        });

        if (!Number.isFinite(minRow) || !Number.isFinite(minCol)) return null;

        const rows: (Tile | null)[][] = [];
        for (let row = minRow; row <= maxRow; row++) {
            const rowTiles: (Tile | null)[] = [];
            for (let col = minCol; col <= maxCol; col++) {
                const tile = session.tileset.getTileFromCoordinates(row, col);
                rowTiles.push(tile && session.selectionState.selectedTilesSet.includes(tile.id) ? tile : null);
            }
            rows.push(rowTiles);
        }

        return rows;
    }
}
