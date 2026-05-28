import { v4 as uuidv4 } from "uuid";

import { RuleLayerData } from "@/shared/schema/layer.schema";
import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { getLayerByObjectId, resolveLayerInsertionParent, getTilemapByObjectId, isLayerInTilemap, markTilemapLayerChanged } from "@/application/commands/command-target.utils";

export class CreateRuleLayerCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()
    private ruleLayerObjectId: string;
    constructor(
        private readonly tilemapObjectId: string,
        private readonly parentLayerObjectId: string,
        private ruleLayerData: RuleLayerData,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const targetLayer = getLayerByObjectId(editorFacade, this.parentLayerObjectId);
        if (!targetLayer || !isLayerInTilemap(tilemap, targetLayer)) return Result.Error("Parent layer not found");

        const parent = resolveLayerInsertionParent(targetLayer, tilemap.rootLayer);

        const newRuleLayer = new RuleLayer(this.ruleLayerData, parent, tilemap, tilemap.objectId);
        parent.addLayer(newRuleLayer);
        objectRegistry.registerTree(newRuleLayer);

        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.ruleLayerObjectId = newRuleLayer.objectId;

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const objectRegistry = editorFacade.objectRegistry;
        if (!objectRegistry) return Result.Error("Object registry not found");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const ruleLayer = getLayerByObjectId<RuleLayer>(editorFacade, this.ruleLayerObjectId);
        if (!(ruleLayer instanceof RuleLayer) || !isLayerInTilemap(tilemap, ruleLayer)) return Result.Error("Rule layer not found");

        ruleLayer.removeFromParent();
        this.ruleLayerData = ruleLayer.serialize();

        objectRegistry.unregisterTree(ruleLayer);
        ruleLayer.destroy();

        markTilemapLayerChanged(editorFacade, this.tilemapObjectId);

        return Result.Success();
    }

    public delete(): void {

    }
}
