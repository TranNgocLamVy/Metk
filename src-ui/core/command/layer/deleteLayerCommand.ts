import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { EditorContext } from "../../application/editorContext";
import { BaseLayer, IGroupLayer } from "../../application/tile/layer/baseLayer";
import { GroupLayer } from "../../application/tile/layer/groupLayer";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class DeleteLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private parentId: string;
    private index: number;
    private layer: BaseLayer<any>;
    constructor(
        private readonly layerId: string,
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.layerId);
        if (!targetLayer) return Result.Error("Target layer not found");
        this.layer = targetLayer;
        const parent = this.layer.parentLayer || root;
        this.parentId = parent.id;
        this.index = parent.getLayerIndex(targetLayer.id);
        this.layer.removeFromParent();

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentId);
        if (!targetLayer) return Result.Error("Target layer not found");
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;
        parent.insertLayer(this.layer, this.index);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public delete(): void {

    }
}