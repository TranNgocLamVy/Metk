import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap, markTilemapLayerChanged } from "@/application/commands/command-object.utils";

export class ToggleOpenGroupLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    constructor(
        private readonly tilemapObjectId: string,
        private readonly targetLayerObjectId: string,
        private readonly force?: boolean
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(editorFacade, this.targetLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");
        if (!(targetLayer instanceof GroupLayer)) return Result.Error("Target layer is not a group layer");

        targetLayer.toggleOpen(this.force);

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        return Result.Error("ToggleOpenGroupLayerCommand cannot be undone");
    }

    public delete(): void {
        
    }
}
