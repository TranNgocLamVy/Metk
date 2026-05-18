import { BaseLayer, IGroupLayer } from "@/editor/application/tile/layer/baseLayer";
import { GroupLayer } from "@/editor/application/tile/layer/groupLayer";
import { TileLayer } from "@/editor/application/tile/layer/tileLayer";
import { TilesetRefManager } from "@/editor/manager/tilesetRefManager";

import { GroupLayerData, LayerData, RuleLayerData, TileLayerData } from "../schema/layerSchema";
import { RulesetRefManager } from "@/editor/manager/rulesetRefManager";
import { RuleLayer } from "@/editor/application/tile/layer/ruleLayer";

export class LayerUtils {
    public static createLayeFromData(layerData: LayerData, parent: IGroupLayer, tilesetRefManager: TilesetRefManager, rulesetRefManager: RulesetRefManager): BaseLayer | null {
        let layer: BaseLayer<any> | null = null;
        switch (layerData.type) {
            case "tile":
                layer = new TileLayer(layerData as TileLayerData, parent, tilesetRefManager, rulesetRefManager);
                break;
            case "auto_rule":
                layer = new RuleLayer(layerData as RuleLayerData, parent, tilesetRefManager, rulesetRefManager);
                break;
            case "group":
                layer = new GroupLayer(layerData as GroupLayerData, parent, tilesetRefManager, rulesetRefManager);
                break;
        }
        return layer;
    }
}