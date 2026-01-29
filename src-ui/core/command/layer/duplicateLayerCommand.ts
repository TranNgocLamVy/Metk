import { v4 as uuidv4 } from "uuid";

import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { EditorContext } from "../../application/editorContext";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class DuplicateLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private newLayerId: string
    constructor(
        private readonly targetLayerId: string,
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return ErrorResult("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return ErrorResult("Target layer not found");

        const duplicateLayer = targetLayer.duplicate();
        if (!duplicateLayer) return ErrorResult("Failed to duplicate layer");
        this.newLayerId = duplicateLayer.id;
        const cloneLayerName = `${targetLayer.name} (copy)`
        duplicateLayer.rename(cloneLayerName);

        currentSession.markAsDirty();

        useLayerManagerStore.getState().refresh();

        return SuccessResult();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return ErrorResult("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.newLayerId);
        if (!targetLayer) return ErrorResult("Target layer not found");
        targetLayer.removeFromParent();

        currentSession.markAsDirty();

        useLayerManagerStore.getState().refresh();

        return SuccessResult();
    }

    public delete(): void {

    }
}