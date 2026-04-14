import { v4 as uuidv4 } from "uuid";

import { EditorContext } from "@/core/application/editorContext";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { IBaseCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";

export class EraseTileCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private oldTilesetId: string | null = null;
    private oldTileId: number | null = null;

    constructor(
        private readonly layerId: string,
        private readonly coordinate: Coordinate,
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId) as TileLayer;
        if (!layer) return Result.Error("Layer not found");

        const tileRef = layer.getTileRefAt(this.coordinate);
        if (!tileRef) return Result.Success();

        this.oldTileId = tileRef.tileId;
        this.oldTilesetId = tileRef.tilesetId;

        const result = layer.removeTileAt(this.coordinate);

        if (result.status === Result.Status.Success) {
            const tileRef = result.data;
            if (tileRef) {
                this.oldTileId = tileRef.tileId;
                this.oldTilesetId = tileRef.tilesetId;
            }
            currentSession.markAsDirty()
        }

        return result
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId) as TileLayer;
        if (!layer) return Result.Error("Layer not found");

        if (this.oldTileId == null || this.oldTilesetId == null) return Result.Success();

        const result = layer.setTileAt(this.coordinate, this.oldTileId, this.oldTilesetId);

        if (result.status === Result.Status.Success) currentSession.markAsDirty();

        return result
    }

    public delete(): void {

    }
}