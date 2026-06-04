import { v4 as uuidv4 } from "uuid";

import { GroupLayerData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";

import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { getLayerByObjectId, resolveLayerInsertionParent, getTilemapByObjectId, isLayerInTilemap } from "@/application/commands/command-target.utils";

export class CreateGroupLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    private groupLayerObjectId: string;
    constructor(
        private readonly tilemapObjectId: string,
        private readonly parentLayerObjectId: string,
        private groupLayerData: GroupLayerData,
    ) { }

    public execute(context: IUndoableCommandContext): Result {
        const objectRegistry = context.objectRegistry;
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(context, this.parentLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Parent layer not found");

        const parent = resolveLayerInsertionParent(targetLayer, tilemap.rootLayer);

        const newGroupLayer = new GroupLayer(this.groupLayerData, parent, tilemap, tilemap.objectId);
        parent.addLayer(newGroupLayer);
        objectRegistry.registerTree(newGroupLayer);

        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.groupLayerObjectId = newGroupLayer.objectId;

        return Result.Success();
    }

    public undo(context: IUndoableCommandContext): Result {
        const objectRegistry = context.objectRegistry;
        const tilemap = getTilemapByObjectId(context, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const groupLayer = getLayerByObjectId<GroupLayer>(context, this.groupLayerObjectId);
        if (!(groupLayer instanceof GroupLayer) || !isLayerInTilemap(tilemap, groupLayer)) return Result.Error("Group layer not found");

        groupLayer.removeFromParent();
        this.groupLayerData = groupLayer.serialize();

        objectRegistry.unregisterTree(groupLayer);
        groupLayer.destroy();

        return Result.Success();
    }

    public delete(): void {

    }
}
