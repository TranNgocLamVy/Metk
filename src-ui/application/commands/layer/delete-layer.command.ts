import { v4 as uuidv4 } from "uuid";

import { getLayerByObjectId, getTilemapByObjectId, isLayerContainer, isLayerInTilemap } from "@/application/commands/command-target.utils";
import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { LayerUtils } from "@/editor/model/tilemap/layer/layer.utils";
import { LayerData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";

export class DeleteLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()

    private parentLayerObjectId: string;
    private index: number;
    private layerData: LayerData;
    constructor(
        private readonly tilemapObjectId: string,
        private readonly layerObjectId: string,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(editorFacade, this.layerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");
        if (targetLayer === tilemap.rootLayer) return Result.Error("Cannot delete root layer");

        this.layerData = targetLayer.serialize();

        const parent = targetLayer.parentLayer || tilemap.rootLayer;
        this.parentLayerObjectId = parent.objectId;
        this.index = parent.getLayerIndex(targetLayer.id);
        targetLayer.removeFromParent();
    
        objectRegistry.unregisterTree(targetLayer);
        targetLayer.destroy();

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const parent = getLayerByObjectId(editorFacade, this.parentLayerObjectId);
        if (!parent || !isLayerInTilemap(tilemap, parent) || !isLayerContainer(parent)) return Result.Error("Parent layer not found");

        const restoredLayer = LayerUtils.createLayerFromData(this.layerData, parent, tilemap, tilemap.objectId);
        if (!restoredLayer) {
            return Result.Error("Failed to restore deleted layer");
        }
        parent.insertLayer(restoredLayer, this.index);

        objectRegistry.registerTree(restoredLayer);

        return Result.Success();
    }

    public delete(): void {

    }
}
