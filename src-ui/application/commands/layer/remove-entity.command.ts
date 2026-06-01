import { v4 as uuidv4 } from "uuid";

import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap } from "@/application/commands/command-target.utils";
import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { EntityInstanceData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";

export class RemoveEntityCommand implements IUndoableCommand {
    public readonly id: string = uuidv4();

    private removedEntities: EntityInstanceData[] = [];

    public constructor(
        private readonly tilemapObjectId: string,
        private readonly layerObjectId: string,
        private readonly entityIds: string[],
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(editorFacade, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof EntityLayer)) return Result.Error("Layer is not an entity layer");

        const result = layer.removeEntities(this.entityIds);

        if (result.status === Result.Status.Success) {
            this.removedEntities = result.data;
        }

        return result;
    }

    public undo(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(editorFacade, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof EntityLayer)) return Result.Error("Layer is not an entity layer");

        if (this.removedEntities.length === 0) {
            return Result.Cancel("No entity removed");
        }

        for (const entity of this.removedEntities) {
            const result = layer.addEntity(entity);
            if (result.status === Result.Status.Error) return result;
        }

        return Result.Success();
    }

    public delete(): void {
        this.removedEntities = [];
    }
}