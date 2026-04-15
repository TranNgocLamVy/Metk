import { v4 as uuidv4 } from "uuid";

import { EditorContext } from "@/core/application/editorContext";
import { IBaseCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";
import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";

export class SetRuleRefCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private rulesetId: string;
    private oldRuleId: string | null;

    constructor(
        private readonly layerId: string,
        private readonly coordinate: Coordinate,
        rulesetId: string
    ) {
        this.rulesetId = rulesetId;
    }

    public execute(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId) as RuleLayer
        if (!layer) return Result.Error("Layer not found");

        const tileRef = layer.getRulesetRefAt(this.coordinate);
        if (tileRef) {
            this.oldRuleId = tileRef.rulesetId;
        } else {
            this.oldRuleId = null;
        }

        const result = layer.setRuleRefAt(this.coordinate, this.rulesetId);

        if (result.status === Result.Status.Success) currentSession.markAsDirty();

        return result
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getCurrentTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId) as RuleLayer;
        if (!layer) return Result.Error("Layer not found");

        if (this.oldRuleId == null) {
            const result = layer.removeTileAt(this.coordinate);
            if (result.status === Result.Status.Success) currentSession.markAsDirty();
            return result;
        }

        const result = layer.setRuleRefAt(this.coordinate, this.oldRuleId);
        if (result.status === Result.Status.Success) currentSession.markAsDirty();

        return result
    }

    public delete(): void {
        
    }
}