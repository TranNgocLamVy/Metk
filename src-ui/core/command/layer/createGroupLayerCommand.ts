import { v4 as uuidv4 } from "uuid";

import { GroupLayerData } from "@/shared/schema/layerSchema";
import { Result } from "@/shared/types/result";

import { EditorContext } from "../../application/editorContext";
import { IGroupLayer } from "../../application/tile/layer/baseLayer";
import { GroupLayer } from "../../application/tile/layer/groupLayer";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class CreateGroupLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private groupLayerId: string;
    constructor(
        private groupLayerData: GroupLayerData,
        private readonly parentLayerId: string,
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentLayerId);
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;

        const newGroupLayer = new GroupLayer(this.groupLayerData, parent, parent.tilesetRefManager, parent.rulesetRefManager, parent.tilemapProps);
        parent.addLayer(newGroupLayer);
        
        if (parent instanceof GroupLayer) parent.toggleOpen(true);
        
        this.groupLayerId = newGroupLayer.id;

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(context: EditorContext): Result {
        const currentSession = context.getActiveTilemapSession()
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