import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";

export class ToggleLayerLockCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private oldIsLocked: boolean
    constructor(
        private readonly targetLayerId: string,
        private readonly newIsLocked: boolean
    ) { }

    public execute(context: EditorFacade): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        this.oldIsLocked = targetLayer.locked;
        targetLayer.toggleLock(this.newIsLocked);

        currentSession.markLayerChange();
        currentSession.emit("onSelectedLayersChanged", currentSession.layerState.selectedLayers);

        return Result.Success();
    }

    public undo(context: EditorFacade): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        
        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        targetLayer.toggleLock(this.oldIsLocked);

        currentSession.markLayerChange();
        currentSession.emit("onSelectedLayersChanged", currentSession.layerState.selectedLayers);

        return Result.Success();
    }

    public delete(): void {
        
    }
}