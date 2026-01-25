import { v4 as uuidv4 } from "uuid";

import { GroupLayerData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { EditorContext } from "../../application/editorContext";
import { IGroupLayer } from "../../application/tile/layer/baseLayer";
import { GroupLayer } from "../../application/tile/layer/groupLayer";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class CreateGroupLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private groupLayerId: string;
    constructor(
        private groupLayerData: GroupLayerData,
        private readonly parentLayerId: string,
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return ErrorResult("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentLayerId);
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;

        const newGroupLayer = new GroupLayer(this.groupLayerData, parent, parent.tilesetRefManager, currentSession.tilemap)

        parent.addLayer(newGroupLayer);
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.groupLayerId = newGroupLayer.id;

        useLayerManagerStore.getState().refresh();

        return SuccessResult();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return ErrorResult("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        const groupLayer = root.findLayer(this.groupLayerId) as GroupLayer;
        groupLayer.removeFromParent();
        this.groupLayerData = groupLayer.serialize();

        useLayerManagerStore.getState().refresh();

        return SuccessResult();
    }

    public delete(): void {

    }
}