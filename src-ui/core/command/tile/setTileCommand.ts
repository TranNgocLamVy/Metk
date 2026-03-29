import { v4 as uuidv4 } from "uuid";

import { EditorContext } from "@/core/application/editorContext";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { IBaseCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";

export class SetTileCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private tilesetId: string;
    private tileId: number;

    private oldTilesetIndex: number | null;
    private oldTileId: number | null;

    constructor(
        private readonly layerId: string,
        private readonly coordinate: Coordinate,
        tileId: number,
        tilesetId: string
    ) {
        this.tileId = tileId;
        this.tilesetId = tilesetId;
    }

    public execute(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId) as TileLayer;
        if (!layer) return Result.Error("Layer not found");

        const tileRef = layer.getTileAt(this.coordinate);
        if (tileRef) {
            const { tileId, tilesetIndex } = tileRef.getTile();
            this.oldTileId = tileId;
            this.oldTilesetIndex = tilesetIndex;
        } else {
            this.oldTilesetIndex = null;
            this.oldTileId = null;
        }

        const result = layer.setTileAt(this.coordinate, this.tileId, this.tilesetId);

        if (result.status === Result.Status.Success) currentSession.markAsDirty();

        return result
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId) as TileLayer;
        if (!layer) return Result.Error("Layer not found");

        if (this.oldTileId == null || this.oldTilesetIndex == null) {
            const result = layer.removeTileAt(this.coordinate);
            if (result.status === Result.Status.Success) currentSession.markAsDirty();
            return result;
        }

        const result = layer.setTileAt(this.coordinate, this.oldTileId, this.oldTilesetIndex);
        if (result.status === Result.Status.Success) currentSession.markAsDirty();

        return result
    }

    public delete(): void {
        
    }
}