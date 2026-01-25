import { v4 as uuidv4 } from "uuid";

import { EditorContext } from "@/core/application/editorContext";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tile } from "@/core/application/tile/tileset";
import { IBaseCommand } from "@/core/interface/IBaseCommand";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";

export class SetTileCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private tilesetId: string;
    private tileId: number;

    private oldTilesetId: string | null;
    private oldTileId: number | null;

    constructor(
        private readonly layerId: string,
        private readonly coordinate: Coordinate,
        tile: Tile
    ) {
        this.tilesetId = tile.tileset.id;
        this.tileId = tile.id;
    }

    public execute(context: EditorContext): Result {
        const tilemapSession = context.getCurrentTilemapSession();
        if (!tilemapSession) return ErrorResult("Tilemap not found");

        const tilemap = tilemapSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId) as TileLayer;
        if (!layer) return ErrorResult("Layer not found");
        
        const tileRef = layer.getTileAt(this.coordinate);
        if (tileRef) {
            const { tileId, tilesetIndex } = tileRef.getTile();
            this.oldTileId = tileId;
            const tileset = tilemap.tilesetRefManager.getTilesetByIndex(tilesetIndex);
            if (!tileset) return ErrorResult("Tileset not found");
            this.oldTilesetId = tileset.id;
        } else {
            this.oldTilesetId = null;
            this.oldTileId = null;
        }

        return layer.setTileAt(this.coordinate, this.tileId, this.tilesetId);
    }

    public undo(context: EditorContext): Result {
        const tilemapSession = context.getCurrentTilemapSession();
        if (!tilemapSession) return ErrorResult("Tilemap not found");

        const tilemap = tilemapSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId) as TileLayer;
        if (!layer) return ErrorResult("Layer not found");

        if (!this.oldTileId || !this.oldTilesetId) return layer.removeTileAt(this.coordinate)
        return layer.setTileAt(this.coordinate, this.oldTileId, this.oldTilesetId);
    }

    public delete(): void {
        
    }
}