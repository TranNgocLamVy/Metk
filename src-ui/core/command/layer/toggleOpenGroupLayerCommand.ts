import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { EditorContext } from "../../application/editorContext";
import { IBaseCommand } from "../../interface/IBaseCommand";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";

export class ToggleOpenGroupLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    constructor(
        private readonly targetLayerId: string,
        private readonly force?: boolean
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return Result.Error("Target layer not found");
        if (!(targetLayer instanceof GroupLayer)) return Result.Error("Target layer is not a group layer");

        targetLayer.toggleOpen(this.force);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(context: EditorContext): Result {
        return Result.Error("ToggleOpenGroupLayerCommand cannot be undone");
    }

    public delete(): void {
        
    }
}