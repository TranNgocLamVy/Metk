import { v4 as uuidv4 } from "uuid";

import { GroupLayerData } from "@/shared/schema/layer.schema";
import { Result } from "@/shared/types/result";

import { IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { IBaseCommand } from "@/editor/interface/base-command.interface";
import { EditorFacade } from "@/application/editor.facade";

export class CreateGroupLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private groupLayerId: string;
    constructor(
        private groupLayerData: GroupLayerData,
        private readonly parentLayerId: string,
    ) { }

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentLayerId);
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;

        const newGroupLayer = new GroupLayer(this.groupLayerData, parent, parent.tilesetRefManager, parent.rulesetRefManager);
        parent.addLayer(newGroupLayer);
        
        if (parent instanceof GroupLayer) parent.toggleOpen(true);
        
        this.groupLayerId = newGroupLayer.id;

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        const groupLayer = root.findLayer(this.groupLayerId) as GroupLayer;
        groupLayer.removeFromParent();
        this.groupLayerData = groupLayer.serialize();

        currentSession.markLayerChange();

        return Result.Success();
    }

    public delete(): void {

    }
}