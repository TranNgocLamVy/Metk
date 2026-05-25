import { v4 as uuidv4 } from "uuid";

import { GroupLayerData } from "@/shared/schema/layer.schema";
import { Result } from "@/shared/types/result";

import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { EditorFacade } from "@/application/editor.facade";
import { getLayerByObjectId, resolveLayerInsertionParent, getTilemapByObjectId, isLayerInTilemap, markTilemapLayerChanged } from "@/application/commands/command-target.utils";

export class CreateGroupLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    private groupLayerObjectId: string;
    constructor(
        private readonly tilemapObjectId: string,
        private readonly parentLayerObjectId: string,
        private groupLayerData: GroupLayerData,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(editorFacade, this.parentLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Parent layer not found");

        const parent = resolveLayerInsertionParent(targetLayer, tilemap.rootLayer);

        const newGroupLayer = new GroupLayer(this.groupLayerData, parent, parent.tilesetRefManager, parent.rulesetRefManager, tilemap.objectId);
        parent.addLayer(newGroupLayer);
        objectRegistry.registerTree(newGroupLayer);

        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.groupLayerObjectId = newGroupLayer.objectId;

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const groupLayer = getLayerByObjectId<GroupLayer>(editorFacade, this.groupLayerObjectId);
        if (!(groupLayer instanceof GroupLayer) || !isLayerInTilemap(tilemap, groupLayer)) return Result.Error("Group layer not found");

        groupLayer.removeFromParent();
        this.groupLayerData = groupLayer.serialize();

        objectRegistry.unregisterTree(groupLayer);
        groupLayer.destroy();

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public delete(): void {

    }
}
