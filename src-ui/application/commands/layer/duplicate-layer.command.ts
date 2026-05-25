import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap, markTilemapLayerChanged } from "@/application/commands/command-target.utils";

export class DuplicateLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    private newLayerObjectId: string
    constructor(
        private readonly tilemapObjectId: string,
        private readonly targetLayerObjectId: string,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(editorFacade, this.targetLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");

        const duplicateLayer = targetLayer.duplicate();
        if (!duplicateLayer) return Result.Error("Failed to duplicate layer");

        objectRegistry.registerTree(duplicateLayer);

        this.newLayerObjectId = duplicateLayer.objectId;
        const cloneLayerName = `${targetLayer.name} (copy)`
        duplicateLayer.rename(cloneLayerName);

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(editorFacade, this.newLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");
        targetLayer.removeFromParent();

        objectRegistry.unregisterTree(targetLayer);
        targetLayer.destroy();

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public delete(): void {
        
    }
}
