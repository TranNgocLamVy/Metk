import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { IBaseCommand } from "@/editor/interface/base-command.interface";
import { EditorFacade } from "@/application/editor.facade";
import { LayerData } from "@/shared/schema/layer.schema";
import { LayerUtils } from "@/shared/utils/layer.utils";

export class DeleteLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private parentId: string;
    private index: number;
    private layerData: LayerData;
    constructor(
        private readonly layerId: string,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.layerId);
        if (!targetLayer) return Result.Error("Target layer not found");

        this.layerData = targetLayer.serialize();

        const parent = targetLayer.parentLayer || root;
        this.parentId = parent.id;
        this.index = parent.getLayerIndex(targetLayer.id);
        targetLayer.removeFromParent();
    
        editorFacade.objectRegistry?.unregisterTree(targetLayer);
        targetLayer.destroy();

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentId);
        if (!targetLayer) return Result.Error("Target layer not found");
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;

        const restoredLayer = LayerUtils.createLayerFromData(this.layerData, parent, parent.tilesetRefManager, parent.rulesetRefManager, parent.objectIdScope);
        if (!restoredLayer) {
            return Result.Error("Failed to restore deleted layer");
        }
        parent.insertLayer(restoredLayer, this.index);

        editorFacade.objectRegistry?.registerTree(restoredLayer);

        currentSession.markLayerChange();

        return Result.Success();
    }

    public delete(): void {

    }
}