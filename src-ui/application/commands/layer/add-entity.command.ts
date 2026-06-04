import { v4 as uuidv4 } from "uuid";

import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap } from "@/application/commands/command-target.utils";
import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { EntityInstanceData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";

export type AddEntityData = Omit<EntityInstanceData, "id"> & {
    id?: string;
};

export class AddEntityCommand implements IUndoableCommand {
    public readonly id: string = uuidv4();

    private entityData: EntityInstanceData;

    public constructor(
        private readonly tilemapObjectId: string,
        private readonly layerObjectId: string,
        data: AddEntityData,
    ) {
        this.entityData = {
            ...data,
            id: data.id ?? uuidv4(),
            entityRef: { ...data.entityRef },
            fields: data.fields ? { ...data.fields } : undefined,
        };
    }

    public execute(context: IUndoableCommandContext): Result {
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(context, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof EntityLayer)) return Result.Error("Layer is not an entity layer");

        return layer.addEntity(this.entityData);
    }

    public undo(context: IUndoableCommandContext): Result {
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(context, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof EntityLayer)) return Result.Error("Layer is not an entity layer");

        return layer.removeEntities([this.entityData.id]);
    }

    public delete(): void { }
}