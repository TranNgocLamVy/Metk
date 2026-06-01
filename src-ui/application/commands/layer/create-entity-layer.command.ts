import { v4 as uuidv4 } from "uuid";

import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap, resolveLayerInsertionParent } from "@/application/commands/command-target.utils";
import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { EntityLayerData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";

export class CreateEntityLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4();

    private entityLayerObjectId: string;

    public constructor(
        private readonly tilemapObjectId: string,
        private readonly parentLayerObjectId: string,
        private entityLayerData: EntityLayerData,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(editorFacade, this.parentLayerObjectId);

        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) {
            return Result.Error("Parent layer not found");
        }

        const parent = resolveLayerInsertionParent(targetLayer, tilemap.rootLayer);

        const newEntityLayer = new EntityLayer(this.entityLayerData, parent, tilemap, tilemap.objectId);

        parent.addLayer(newEntityLayer);
        objectRegistry.registerTree(newEntityLayer);

        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.entityLayerObjectId = newEntityLayer.objectId;

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const entityLayer = getLayerByObjectId<EntityLayer>(editorFacade, this.entityLayerObjectId);

        if (!(entityLayer instanceof EntityLayer) || !isLayerInTilemap(tilemap, entityLayer)) {
            return Result.Error("Entity layer not found");
        }

        entityLayer.removeFromParent();
        this.entityLayerData = entityLayer.serialize();

        objectRegistry.unregisterTree(entityLayer);
        entityLayer.destroy();

        return Result.Success();
    }

    public delete(): void { }
}