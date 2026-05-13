import { v4 as uuidv4 } from "uuid";

import { RuleLayerData } from "@/shared/schema/layerSchema";
import { Result } from "@/shared/types/result";

import { EditorContext } from "../../application/editorContext";
import { IGroupLayer } from "../../application/tile/layer/baseLayer";
import { GroupLayer } from "../../application/tile/layer/groupLayer";
import { IBaseCommand } from "../../interface/IBaseCommand";
import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";

export class CreateRuleLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private ruleLayerId: string;
    constructor(
        private ruleLayerData: RuleLayerData,
        private readonly parentLayerId: string,
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const tilemap = currentSession.tilemap;
        const root = tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentLayerId);
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;

        const newRuleLayer = new RuleLayer(this.ruleLayerData, parent, parent.tilesetRefManager, tilemap.rulesetRefManager);
        parent.addLayer(newRuleLayer);
        
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.ruleLayerId = newRuleLayer.id;

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        const ruleLayer = root.findLayer(this.ruleLayerId) as RuleLayer;
        ruleLayer.removeFromParent();
        this.ruleLayerData = ruleLayer.serialize();

        currentSession.markLayerChange();
        
        return Result.Success();
    }

    public delete(): void {

    }
}