import { v4 as uuidv4 } from "uuid";

import { TileLayerData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { getLayerByObjectId, resolveLayerInsertionParent, getTilemapByObjectId, isLayerInTilemap } from "@/application/commands/command-target.utils";

export class CreateTileLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    private tileLayerObjectId: string;
    constructor(
        private readonly tilemapObjectId: string,
        private readonly parentLayerObjectId: string,
        private tileLayerData: TileLayerData,
    ) { }

    public execute(context: IUndoableCommandContext): Result {
        const objectRegistry = context.objectRegistry;
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(context, this.parentLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Parent layer not found");

        const parent = resolveLayerInsertionParent(targetLayer, tilemap.rootLayer);

        const newTileLayer = new TileLayer(this.tileLayerData, parent, tilemap, tilemap.objectId);
        parent.addLayer(newTileLayer);
        objectRegistry.registerTree(newTileLayer);
        
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.tileLayerObjectId = newTileLayer.objectId;

        return Result.Success();
    }

    public undo(context: IUndoableCommandContext): Result {
        const objectRegistry = context.objectRegistry;
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const tileLayer = getLayerByObjectId<TileLayer>(context, this.tileLayerObjectId);
        if (!(tileLayer instanceof TileLayer) || !isLayerInTilemap(tilemap, tileLayer)) return Result.Error("Tile layer not found");

        tileLayer.removeFromParent();

        this.tileLayerData = tileLayer.serialize();

        objectRegistry.unregisterTree(tileLayer);
        tileLayer.destroy();

        return Result.Success();
    }

    public delete(): void {

    }
}
