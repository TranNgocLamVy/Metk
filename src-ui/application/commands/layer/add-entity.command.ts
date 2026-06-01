import { v4 as uuidv4 } from "uuid";

import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap } from "@/application/commands/command-target.utils";
import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { EntityInstanceData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";

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

    public execute(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(editorFacade, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof EntityLayer)) return Result.Error("Layer is not an entity layer");

        return layer.addEntity(this.entityData);
    }

    public undo(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(editorFacade, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof EntityLayer)) return Result.Error("Layer is not an entity layer");

        return layer.removeEntities([this.entityData.id]);
    }

    public delete(): void { }
}