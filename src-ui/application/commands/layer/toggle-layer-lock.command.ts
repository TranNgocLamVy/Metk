import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { emitSelectedLayersChanged, getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap, markTilemapLayerChanged } from "@/application/commands/command-target.utils";

export class ToggleLayerLockCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    private oldIsLocked: boolean
    constructor(
        private readonly tilemapObjectId: string,
        private readonly targetLayerObjectId: string,
        private readonly newIsLocked: boolean
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(editorFacade, this.targetLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");

        this.oldIsLocked = targetLayer.locked;
        targetLayer.toggleLock(this.newIsLocked);

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);
        emitSelectedLayersChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");
        
        const targetLayer = getLayerByObjectId(editorFacade, this.targetLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");

        targetLayer.toggleLock(this.oldIsLocked);

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);
        emitSelectedLayersChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public delete(): void {
        
    }
}
