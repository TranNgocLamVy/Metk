import { v4 as uuidv4 } from "uuid";

import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { EditorContext } from "../../application/editorContext";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class RenameLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private oldName: string;
    constructor(
        private readonly targetLayerId: string,
        private readonly newName: string,
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return ErrorResult("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return ErrorResult("Target layer not found");

        this.oldName = targetLayer.name;
        targetLayer.rename(this.newName);

        useLayerManagerStore.getState().refresh()

        return SuccessResult();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return ErrorResult("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        
        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return ErrorResult("Target layer not found");

        targetLayer.rename(this.oldName);

        useLayerManagerStore.getState().refresh()

        return SuccessResult();
    }

    public delete(): void {
        
    }
}