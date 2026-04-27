import { v4 as uuidv4 } from "uuid";

import { EditorContext } from "@/core/application/editorContext";
import { IBaseCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";
import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";

export class SetRuleRefsCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private oldRules: { coordinate: Coordinate, oldRulesetId: string | null }[] = [];

    constructor(
        private readonly layerId: string,
        private readonly updates: { coordinate: Coordinate, rulesetId: string | null }[]
    ) {}

    public execute(context: EditorContext): Result {
        const currentSession = context.getActiveTilemapSession();
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

    public undo(context: EditorContext): Result {
        if (this.oldRules.length === 0) return Result.Cancel("No rule changed");

        const currentSession = context.getActiveTilemapSession();
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