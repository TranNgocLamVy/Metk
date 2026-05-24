import { v4 as uuidv4 } from "uuid";

import { RuleLayerData } from "@/shared/schema/layer.schema";
import { Result } from "@/shared/types/result";

import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";
import { IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";

export class CreateRuleLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private ruleLayerId: string;
    constructor(
        private ruleLayerData: RuleLayerData,
        private readonly parentLayerId: string,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const tilemap = currentSession.tilemap;
        const root = tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentLayerId);
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;

        const newRuleLayer = new RuleLayer(this.ruleLayerData, parent, parent.tilesetRefManager, tilemap.rulesetRefManager, parent.objectIdScope);
        parent.addLayer(newRuleLayer);
        editorFacade.objectRegistry?.registerTree(newRuleLayer);

        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.ruleLayerId = newRuleLayer.id;

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        const ruleLayer = root.findLayer(this.ruleLayerId) as RuleLayer;
        ruleLayer.removeFromParent();
        this.ruleLayerData = ruleLayer.serialize();

        editorFacade.objectRegistry?.unregisterTree(ruleLayer);
        ruleLayer.destroy();

        currentSession.markLayerChange();

        return Result.Success();
    }

    public delete(): void {

    }
}