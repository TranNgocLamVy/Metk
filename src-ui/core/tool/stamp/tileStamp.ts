import { Container, Sprite } from "pixi.js";
import { IStamp, StampPreviewData } from "./IStamp";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { EditorContext } from "@/core/application/editorContext";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { SetTilesCommand } from "@/core/command/tile/setTilesCommand";
// ... import other dependencies (EditorContext, TilemapSession, etc.)

export class TileStamp implements IStamp {
    public canHandle(layer: any): boolean {
        return layer instanceof TileLayer;
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

    public stampAt(coord: Coordinate, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container, previewMap: Map<string, StampPreviewData>): void {
        const tiles = editorContext.getSelectedTile();
        if (!tiles || !tiles.length) return;

        for (let r = 0; r < tiles.length; r++) {
            const row = tiles[r];
            for (let c = 0; c < row.length; c++) {
                const tile = row[c];
                const targetX = coord.col + c;
                const targetY = coord.row + r;

                if (targetX < 0 || targetX >= session.tilemap.width || targetY < 0 || targetY >= session.tilemap.height) continue;
                if (!tile) continue;

                const texture = editorContext.textureManager.getTileTexture(tile.tileset.id, tile.id);
                if (!texture) continue;

                const key = `${targetX},${targetY}`;
                if (previewMap.has(key)) {
                    const data = previewMap.get(key)!;
                    data.sprite.texture = texture;
                    data.tileId = tile.id;
                    data.tilesetId = tile.tileset.id;
                } else {
                    const sprite = new Sprite(texture);
                    sprite.position.set(targetX * session.tilemap.tilewidth, targetY * session.tilemap.tileheight);
                    overlayContainer.addChild(sprite);
                    previewMap.set(key, { sprite, tileId: tile.id, tilesetId: tile.tileset.id });
                }
            }
        }
    }

    public commit(layer: any, previewMap: Map<string, StampPreviewData>, editorContext: EditorContext, historyManager: any): void {
        const payload = Array.from(previewMap).map(([key, data]) => {
            const [col, row] = key.split(',').map(Number);
            return { coordinate: { col, row }, tileId: data.tileId, tilesetId: data.tilesetId };
        });
        
        historyManager.startTransaction();
        historyManager.execute(new SetTilesCommand(layer.id, payload), editorContext);
        historyManager.commitTransaction();
    }
}