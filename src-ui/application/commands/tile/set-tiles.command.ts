import { v4 as uuidv4 } from "uuid";

import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { SetTilesData, TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap } from "@/application/commands/command-target.utils";

export class SetTilesCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()

    private data: SetTilesData[] = [];
    private oldData: SetTilesData[] = [];

    constructor(
        private readonly tilemapObjectId: string,
        private readonly layerObjectId: string,
        data: SetTilesData[],
    ) {
        this.data = [...data];
    }

    public execute(context: IUndoableCommandContext): Result {
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(context, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof TileLayer)) return Result.Error("Layer is not a tile layer");

        const result = layer.setTilesAt(this.data);

        if (result.status === Result.Status.Success) this.oldData = result.data;

        return result
    }

    public undo(context: IUndoableCommandContext): Result {
        if (this.oldData.length === 0) return Result.Cancel("No tile changed");

        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(context, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof TileLayer)) return Result.Error("Layer is not a tile layer");

        if (this.oldData.length === 0) return Result.Cancel("No tile changed");

        const result = layer.setTilesAt(this.oldData);

        return result
    }

    public delete(): void {
        this.data = [];
        this.oldData = [];
    }
}
