import { v4 as uuidv4 } from "uuid";

import { EditorFacade } from "@/application/editor.facade";
import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { getLayerByObjectId, getTilemapByObjectId, isLayerInTilemap, markTilemapDirty } from "@/application/commands/command-object.utils";

export class SetRulesCommand implements IUndoableCommand {
    public readonly id: string = uuidv4()

    private oldRules: { coordinate: Coordinate, oldRulesetId: string | null }[] = [];

    constructor(
        private readonly tilemapObjectId: string,
        private readonly layerObjectId: string,
        private readonly updates: { coordinate: Coordinate, rulesetId: string | null }[]
    ) {}

    public execute(editorFacade: EditorFacade): Result {
        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(editorFacade, this.layerObjectId)
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof RuleLayer)) return Result.Error("Layer is not a rule layer");

        const result = layer.setRuleRefsAt(this.updates);

        if (result.status === Result.Status.Success && result.data) {
            this.oldRules = result.data;
            markTilemapDirty(editorFacade, this.tilemapObjectId);
        }

        return result
    }

    public undo(editorFacade: EditorFacade): Result {
        if (this.oldRules.length === 0) return Result.Cancel("No rule changed");

        const tilemap = getTilemapByObjectId(editorFacade, this.tilemapObjectId);
        if (!tilemap) return Result.Error("Tilemap not found");

        const layer = getLayerByObjectId(editorFacade, this.layerObjectId);
        if (!layer || !isLayerInTilemap(tilemap, layer)) return Result.Error("Layer not found");
        if (!(layer instanceof RuleLayer)) return Result.Error("Layer is not a rule layer");

        const undoUpdates = this.oldRules.map(old => ({
            coordinate: old.coordinate,
            rulesetId: old.oldRulesetId
        }));

        const result = layer.setRuleRefsAt(undoUpdates);
        if (result.status === Result.Status.Success) markTilemapDirty(editorFacade, this.tilemapObjectId);

        return result
    }

    public delete(): void {
        this.oldRules = [];
    }
}
