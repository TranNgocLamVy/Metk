import { v4 as uuidv4 } from "uuid";

import { TileLayerData } from "@/shared/schema/layerSchema";
import { Result } from "@/shared/types/result";
import { EditorContext } from "../../application/editorContext";
import { IGroupLayer } from "../../application/tile/layer/baseLayer";
import { GroupLayer } from "../../application/tile/layer/groupLayer";
import { TileLayer } from "../../application/tile/layer/tileLayer";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class CreateTileLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private tileLayerId: string;
    constructor(
        private tileLayerData: TileLayerData,
        private readonly parentLayerId: string,
    ) { }

    public execute(context: EditorContext): Result {
        const currentSession = context.getActiveTilemapSession()
        if (!currentSession) return Result.Error("Current session not found");
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.parentLayerId);
        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root) as IGroupLayer;

        const newTileLayer = new TileLayer(this.tileLayerData, parent, parent.tilesetRefManager, parent.rulesetRefManager, parent.tilemapProps);
        parent.addLayer(newTileLayer);
        
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        this.tileLayerId = newTileLayer.id;

        currentSession.markLayerChange();

        return Result.Success();
    }

    public undo(context: EditorContext): Result {
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