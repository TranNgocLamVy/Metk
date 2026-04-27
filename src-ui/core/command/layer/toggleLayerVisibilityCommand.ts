import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
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
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        this.oldIsVisible = targetLayer.visible;
        targetLayer.toggleVisibility(this.newIsVisible);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        
        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        targetLayer.toggleVisibility(this.oldIsVisible);

        currentSession.markLayerChange();
        
        return Result.Success();
    }

    public delete(): void {
        
    }
}