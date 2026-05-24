import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";

export class DuplicateLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private newLayerId: string
    constructor(
        private readonly targetLayerId: string,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        const duplicateLayer = targetLayer.duplicate();
        if (!duplicateLayer) return Result.Error("Failed to duplicate layer");

        editorFacade.objectRegistry?.registerTree(duplicateLayer);

        this.newLayerId = duplicateLayer.id;
        const cloneLayerName = `${targetLayer.name} (copy)`
        duplicateLayer.rename(cloneLayerName);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.newLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");
        targetLayer.removeFromParent();

        editorFacade.objectRegistry?.unregisterTree(targetLayer);
        targetLayer.destroy();

        currentSession.markLayerChange();

        return Result.Success();
    }

    public delete(): void {

    }
}