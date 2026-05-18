import { v4 as uuidv4 } from "uuid";

import { TileLayerData } from "@/shared/schema/layer.schema";
import { Result } from "@/shared/types/result";
import { EditorFacade } from "@/application/editor.facade";
import { IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { IBaseCommand } from "@/editor/interface/base-command.interface";

export class CreateTileLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private tileLayerId: string;
    constructor(
        private tileLayerData: TileLayerData,
        private readonly parentLayerId: string,
    ) { }

    public execute(context: EditorFacade): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentLayerId);
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;

        const newTileLayer = new TileLayer(this.tileLayerData, parent, parent.tilesetRefManager, parent.rulesetRefManager);
        parent.addLayer(newTileLayer);
        
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.tileLayerId = newTileLayer.id;

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(context: EditorFacade): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;
        const tileLayer = root.findLayer(this.tileLayerId) as TileLayer;
        tileLayer.removeFromParent();
        this.tileLayerData = tileLayer.serialize();

        currentSession.markLayerChange();
        
        return Result.Success();
    }

    public delete(): void {

    }
}