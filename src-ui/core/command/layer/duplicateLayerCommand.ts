import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { useLayerManagerStore } from "@/view/stores/layerManagerStore";

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
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        const duplicateLayer = targetLayer.duplicate();
        if (!duplicateLayer) return Result.Error("Failed to duplicate layer");
        this.newLayerId = duplicateLayer.id;
        const cloneLayerName = `${targetLayer.name} (copy)`
        duplicateLayer.rename(cloneLayerName);

        currentSession.markAsDirty();

        useLayerManagerStore.getState().refresh();

        return Result.Success();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.newLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");
        targetLayer.removeFromParent();

        currentSession.markAsDirty();

        useLayerManagerStore.getState().refresh();

        return Result.Success();
    }

    public delete(): void {

    }
}