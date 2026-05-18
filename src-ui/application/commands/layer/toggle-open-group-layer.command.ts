import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";

export class ToggleOpenGroupLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    constructor(
        private readonly targetLayerId: string,
        private readonly force?: boolean
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");
        if (!(targetLayer instanceof GroupLayer)) return Result.Error("Target layer is not a group layer");

        targetLayer.toggleOpen(this.force);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        return Result.Error("ToggleOpenGroupLayerCommand cannot be undone");
    }

    public delete(): void {
        
    }
}