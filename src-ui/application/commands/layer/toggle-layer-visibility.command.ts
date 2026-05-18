import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";

export class ToggleLayerVisibilityCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private oldIsVisible: boolean
    constructor(
        private readonly targetLayerId: string,
        private readonly newIsVisible: boolean
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        this.oldIsVisible = targetLayer.visible;
        targetLayer.toggleVisibility(this.newIsVisible);

        currentSession.markLayerChange();
        currentSession.emit("onSelectedLayersChanged", currentSession.layerState.selectedLayers);

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        
        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        targetLayer.toggleVisibility(this.oldIsVisible);

        currentSession.markLayerChange();
        currentSession.emit("onSelectedLayersChanged", currentSession.layerState.selectedLayers);
        return Result.Success();
    }

    public delete(): void {
        
    }
}