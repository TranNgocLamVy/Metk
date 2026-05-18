import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";

export class RenameLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private oldName: string;
    constructor(
        private readonly targetLayerId: string,
        private readonly newName: string,
    ) { }

    public execute(context: EditorFacade): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        this.oldName = targetLayer.name;
        targetLayer.rename(this.newName);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(context: EditorFacade): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        
        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        targetLayer.rename(this.oldName);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public delete(): void {
        
    }
}