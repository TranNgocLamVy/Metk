import { v4 as uuidv4 } from "uuid";

import { EditorContext } from "@/core/application/editorContext";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { IBaseCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";

export class SetTileCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private tilesetId: string;
    private tileId: number;

    private oldTilesetId: string | null;
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

        const tileRef = layer.getTileRefAt(this.coordinate);
        if (tileRef) {
            this.oldTileId = tileRef.tileId;
            this.oldTilesetId = tileRef.tilesetId;
        } else {
            this.oldTilesetId = null;
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

        if (this.oldTileId == null || this.oldTilesetId == null) {
            const result = layer.removeTileAt(this.coordinate);
            if (result.status === Result.Status.Success) currentSession.markAsDirty();
            return result;
        }

        const result = layer.setTileAt(this.coordinate, this.oldTileId, this.oldTilesetId);
        if (result.status === Result.Status.Success) currentSession.markAsDirty();

        return result
    }

    public delete(): void {
        
    }
}