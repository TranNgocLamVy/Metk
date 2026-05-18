import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { IBaseCommand } from "@/editor/interface/base-command.interface";

export class MoveLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private oldParentLayerId: string
    private oldIndex: number
    constructor(
        private readonly parentLayerId: string,
        private readonly targetLayerId: string,
        private readonly newIndex: number
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const rawParentLayer = root.findLayer(this.parentLayerId);
        const targetLayer = root.findLayer(this.targetLayerId);

        if (!rawParentLayer || !targetLayer) return Result.Error("Target layer not found");

        const newParentLayer = rawParentLayer instanceof GroupLayer ? rawParentLayer : (rawParentLayer?.parentLayer ? rawParentLayer.parentLayer : root);

        this.oldParentLayerId = targetLayer.parentLayer ? targetLayer.parentLayer.id : root.id;
        this.oldIndex = targetLayer.parentLayer ? targetLayer.parentLayer.getLayerIndex(targetLayer.id) : root.layers.indexOf(targetLayer);

        targetLayer.removeFromParent();

        newParentLayer.insertLayer(targetLayer, this.newIndex);
        if (newParentLayer instanceof GroupLayer && !newParentLayer.isOpen) newParentLayer.toggleOpen(true);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        
        const rawOldParentLayer = root.findLayer(this.oldParentLayerId);
        const targetLayer = root.findLayer(this.targetLayerId);

        if (!targetLayer || !rawOldParentLayer) return Result.Error("Target layer not found");

        const oldParentLayer = rawOldParentLayer instanceof GroupLayer ? rawOldParentLayer : (rawOldParentLayer?.parentLayer ? rawOldParentLayer.parentLayer : root);

        targetLayer.removeFromParent();

        oldParentLayer.insertLayer(targetLayer, this.oldIndex);
        if (oldParentLayer instanceof GroupLayer && !oldParentLayer.isOpen) oldParentLayer.toggleOpen(true);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public delete(): void {
        
    }
}