import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";

import { getLayerByObjectId, getTilemapByObjectId, isLayerContainer, isLayerInTilemap } from "@/application/commands/command-target.utils";
import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { LayerUtils } from "@/editor/model/tilemap/layer/layer.utils";
import { LayerData } from "@/shared/data-types/layer.data";

export class DuplicateLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    private newLayerObjectId: string
    private parentLayerObjectId: string;
    private index: number;
    private layerData: LayerData;
    constructor(
        private readonly tilemapObjectId: string,
        private readonly targetLayerObjectId: string,
    ) { }

    public execute(context: IUndoableCommandContext): Result {
        const objectRegistry = context.objectRegistry;
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        if (this.layerData) {
            const parent = getLayerByObjectId(context, this.parentLayerObjectId);
            if (!parent || !isLayerInTilemap(tilemap, parent) || !isLayerContainer(parent)) return Result.Error("Parent layer not found");

            const restoredLayer = LayerUtils.createLayerFromData(this.layerData, parent, tilemap, tilemap.objectId);
            if (!restoredLayer) return Result.Error("Failed to restore duplicated layer");

            parent.insertLayer(restoredLayer, this.index);
            objectRegistry.registerTree(restoredLayer);

            return Result.Success();
        }

        const targetLayer = getLayerByObjectId(context, this.targetLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");

        const duplicateLayer = targetLayer.duplicate();
        if (!duplicateLayer) return Result.Error("Failed to duplicate layer");

        objectRegistry.registerTree(duplicateLayer);

        this.newLayerObjectId = duplicateLayer.objectId;
        const cloneLayerName = `${targetLayer.name} (copy)`
        duplicateLayer.rename(cloneLayerName);
        this.parentLayerObjectId = duplicateLayer.parentLayer.objectId;
        this.index = duplicateLayer.parentLayer.getLayerIndex(duplicateLayer.id);
        this.layerData = duplicateLayer.serialize();

        return Result.Success();
    }

    public undo(context: IUndoableCommandContext): Result {
        const objectRegistry = context.objectRegistry;
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(context, this.newLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Target layer not found");
        targetLayer.removeFromParent();

        objectRegistry.unregisterTree(targetLayer);
        targetLayer.destroy();

        return Result.Success();
    }

    public delete(): void {
        
    }
}
