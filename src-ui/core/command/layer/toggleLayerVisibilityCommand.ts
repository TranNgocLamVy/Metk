import { v4 as uuidv4 } from "uuid";

import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { EditorContext } from "../../application/editorContext";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class ToggleLayerVisibilityCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private oldIsVisible: boolean
    constructor(
        private readonly targetLayerId: string,
        private readonly newIsVisible: boolean
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return ErrorResult("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return ErrorResult("Target layer not found");

        this.oldIsVisible = targetLayer.visible;
        targetLayer.toggleVisibility(this.newIsVisible);

        currentSession.markAsDirty();

        useLayerManagerStore.getState().refresh()

        return SuccessResult();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return ErrorResult("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        
        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return ErrorResult("Target layer not found");

        targetLayer.toggleVisibility(this.oldIsVisible);

        currentSession.markAsDirty();

        useLayerManagerStore.getState().refresh()
        
        return SuccessResult();
    }

    public delete(): void {
        
    }
}