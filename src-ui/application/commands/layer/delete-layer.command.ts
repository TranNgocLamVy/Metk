import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { EditorFacade } from "@/application/editor.facade";
import { LayerData } from "@/shared/schema/layer.schema";
import { LayerUtils } from "@/shared/utils/layer.utils";
import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap, isLayerContainer, markTilemapLayerChanged } from "@/application/commands/command-target.utils";

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

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

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

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public delete(): void {

    }
}
