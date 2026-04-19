import { Container, Sprite } from "pixi.js";
import { IDrawStrategy, DrawPayload } from "./IDrawStrategy";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { EditorContext } from "@/core/application/editorContext";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { SetTilesCommand } from "@/core/command/tile/setTilesCommand";


export class DrawTileStrategy implements IDrawStrategy {
    public canHandle(layer: any): boolean {
        return layer instanceof TileLayer;
    }

    public getRefAt(coord: Coordinate, layer: TileLayer): any {
        return layer.getTileRefAt(coord);
    }

    public getBrushSize(editorContext: EditorContext): { width: number, height: number } {
        const selectedTiles = editorContext.getSelectedTile();
        if (!selectedTiles) return { width: 1, height: 1 };
        const width = selectedTiles.length;
        const height = selectedTiles[0].length;
        return { width, height };
    }

    public drawHoverPreview(coord: Coordinate, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container): Sprite[] {
        const selectedTiles = editorContext.getSelectedTile();
        if (!selectedTiles) return [];

        const sprites: Sprite[] = [];
        for (let r = 0; r < selectedTiles.length; r++) {
            const rowTiles = selectedTiles[r];
            for (let c = 0; c < rowTiles.length; c++) {
                const tile = rowTiles[c];
                if (!tile) continue;

                const col = coord.col + c;
                const row = coord.row + r;
                if (col < 0 || col >= session.tilemap.width || row < 0 || row >= session.tilemap.height) continue;

                const texture = editorContext.textureManager.getTileTexture(tile.tileset.id, tile.id);
                if (!texture) continue;

                const sprite = new Sprite(texture);
                sprite.position.set(col * session.tilemap.tilewidth, row * session.tilemap.tileheight);
                overlayContainer.addChild(sprite);
                sprites.push(sprite);
            }
        }
        return sprites;
    }

    public getPayload(coord: Coordinate, editorContext: EditorContext, session: TilemapSession): DrawPayload[] {
        const selectedTiles = editorContext.getSelectedTile();
        if (!selectedTiles) return [];

        const data: DrawPayload[] = [];
        for (let r = 0; r < selectedTiles.length; r++) {
            const rowTiles = selectedTiles[r];
            for (let c = 0; c < rowTiles.length; c++) {
                const tile = rowTiles[c];
                if (!tile) continue;

                const col = coord.col + c;
                const row = coord.row + r;
                if (!session.tilemap.isInBoundary({ col, row })) continue;

                const texture = editorContext.textureManager.getTileTexture(tile.tileset.id, tile.id);
                if (!texture) continue;

                const sprite = new Sprite(texture);
                data.push({ sprite, coordinate: { col, row }, tileId: tile.id, tilesetId: tile.tileset.id });
            }
        }
        return data;
    }

    public commit(layer: TileLayer, previewData: DrawPayload[], editorContext: EditorContext): void {
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!historyManager) return;

        const updates = previewData.map((data) => {
            const { col, row } = data.coordinate;
            return { coordinate: { col, row }, tileId: data.tileId, tilesetId: data.tilesetId };
        });

        if (updates.length == 0) return;

        historyManager.startTransaction();
        historyManager.execute(new SetTilesCommand(layer.id, updates), editorContext);
        historyManager.commitTransaction();
    }
}