import { v4 as uuidv4 } from "uuid";

import {
    getLayerByObjectId,
    getTilemapByObjectId,
    isLayerInTilemap,
    resolveLayerInsertionParent,
} from "@/application/commands/command-target.utils";
import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { ImageLayerData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";

export class CreateImageLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4();

    private imageLayerObjectId: string;

    constructor(
        private readonly tilemapObjectId: string,
        private readonly parentLayerObjectId: string,
        private imageLayerData: ImageLayerData,
    ) { }

    public execute(context: IUndoableCommandContext): Result {
        const objectRegistry = context.objectRegistry;
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(
            context,
            this.parentLayerObjectId,
        );

        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) {
            return Result.Error("Parent layer not found");
        }

        const parent = resolveLayerInsertionParent(
            targetLayer,
            tilemap.rootLayer,
        );

        const newImageLayer = new ImageLayer(this.imageLayerData, parent, tilemap, tilemap.objectId);

        parent.addLayer(newImageLayer);
        objectRegistry.registerTree(newImageLayer);

        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.imageLayerObjectId = newImageLayer.objectId;

        return Result.Success();
    }

    public undo(context: IUndoableCommandContext): Result {
        const objectRegistry = context.objectRegistry;
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const imageLayer = getLayerByObjectId<ImageLayer>(
            context,
            this.imageLayerObjectId,
        );

        if (!(imageLayer instanceof ImageLayer) || !isLayerInTilemap(tilemap, imageLayer)) {
            return Result.Error("Image layer not found");
        }

        imageLayer.removeFromParent();
        this.imageLayerData = imageLayer.serialize();

        objectRegistry.unregisterTree(imageLayer);
        imageLayer.destroy();

        return Result.Success();
    }

    public delete(): void { }
}
