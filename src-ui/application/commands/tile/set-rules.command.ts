import { v4 as uuidv4 } from "uuid";

import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";

export class SetRulesCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private oldRules: { coordinate: Coordinate, oldRulesetId: string | null }[] = [];

    constructor(
        private readonly layerId: string,
        private readonly updates: { coordinate: Coordinate, rulesetId: string | null }[]
    ) {}

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId)
        if (!layer) return Result.Error("Layer not found");
        if (!(layer instanceof RuleLayer)) return Result.Error("Layer is not a rule layer");

        const result = layer.setRuleRefsAt(this.updates);

        if (result.status === Result.Status.Success && result.data) {
            this.oldRules = result.data;
            currentSession.markAsDirty();
        }

        return result
    }

    public undo(editorFacade: EditorFacade): Result {
        if (this.oldRules.length === 0) return Result.Cancel("No rule changed");

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId);
        if (!layer) return Result.Error("Layer not found");
        if (!(layer instanceof RuleLayer)) return Result.Error("Layer is not a rule layer");

        const undoUpdates = this.oldRules.map(old => ({
            coordinate: old.coordinate,
            rulesetId: old.oldRulesetId
        }));

        const result = layer.setRuleRefsAt(undoUpdates);
        if (result.status === Result.Status.Success) currentSession.markAsDirty();

        return result
    }

    public delete(): void {
        
    }
}