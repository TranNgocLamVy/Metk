import { v4 as uuidv4 } from "uuid";

import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

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

    public execute(context: EditorContext): void {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.layerId);
        if (!targetLayer) return;
        this.layer = targetLayer;
        const parent = this.layer.parentLayer || root;
        this.parentId = parent.id;
        this.index = parent.getLayerIndex(targetLayer.id);
        this.layer.removeFromParent();

        useLayerManagerStore.getState().refresh()
    }

    public undo(context: EditorContext): void {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentId);
        if (!targetLayer) return;
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;
        parent.insertLayer(this.layer, this.index);

        useLayerManagerStore.getState().refresh()
    }

    public delete(): void {

    }
}