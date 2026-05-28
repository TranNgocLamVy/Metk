import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { getLayerByObjectId, resolveLayerInsertionParent, getTilemapByObjectId, isLayerInTilemap } from "@/application/commands/command-target.utils";
import { IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";

export class MoveLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    private oldParentLayerObjectId: string
    private oldIndex: number
    constructor(
        private readonly tilemapObjectId: string,
        private readonly parentLayerObjectId: string,
        private readonly targetLayerObjectId: string,
        private readonly newIndex: number
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const rawParentLayer = getLayerByObjectId(editorFacade, this.parentLayerObjectId);
        const targetLayer = getLayerByObjectId(editorFacade, this.targetLayerObjectId);

        if (!rawParentLayer || !targetLayer || !isLayerInTilemap(tilemap, rawParentLayer) || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");
        if (targetLayer === tilemap.rootLayer) return Result.Error("Cannot move root layer");

        const newParentLayer = resolveLayerInsertionParent(rawParentLayer, tilemap.rootLayer);
        if (this.newIndex < 0) return Result.Error("Invalid layer's index: " + this.newIndex);
        let parentCursor: IGroupLayer | null = newParentLayer;
        while (parentCursor) {
            if (parentCursor.objectId === targetLayer.objectId) return Result.Error("Cannot move a layer into itself or its descendant");
            parentCursor = parentCursor.parentLayer;
        }

        this.oldParentLayerObjectId = targetLayer.parentLayer ? targetLayer.parentLayer.objectId : tilemap.rootLayer.objectId;
        this.oldIndex = targetLayer.parentLayer ? targetLayer.parentLayer.getLayerIndex(targetLayer.id) : tilemap.rootLayer.layers.indexOf(targetLayer);

        targetLayer.removeFromParent();

        newParentLayer.insertLayer(targetLayer, this.newIndex);
        if (newParentLayer instanceof GroupLayer && !newParentLayer.isOpen) newParentLayer.toggleOpen(true);

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");
        
        const rawOldParentLayer = getLayerByObjectId(editorFacade, this.oldParentLayerObjectId);
        const targetLayer = getLayerByObjectId(editorFacade, this.targetLayerObjectId);

        if (!targetLayer || !rawOldParentLayer || !isLayerInTilemap(tilemap, targetLayer) || !isLayerInTilemap(tilemap, rawOldParentLayer)) return Result.Error("Target layer not found");

        const oldParentLayer = resolveLayerInsertionParent(rawOldParentLayer, tilemap.rootLayer);

        targetLayer.removeFromParent();

        oldParentLayer.insertLayer(targetLayer, this.oldIndex);
        if (oldParentLayer instanceof GroupLayer && !oldParentLayer.isOpen) oldParentLayer.toggleOpen(true);

        return Result.Success();
    }

    public delete(): void {
        
    }
}
