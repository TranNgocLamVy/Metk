import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";

import { GroupLayerData, LayerData, RuleLayerData, TileLayerData } from "../schema/layer.schema";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";

export class LayerUtils {
    public static createLayerFromData(layerData: LayerData,parent: IGroupLayer,tilesetRefManager: TilesetRefManager,rulesetRefManager: RulesetRefManager): BaseLayer<any> | null {
        switch (layerData.type) {
            case "tile":
                return new TileLayer(layerData, parent, tilesetRefManager, rulesetRefManager);
    
            case "auto_rule":
                return new RuleLayer(layerData, parent, tilesetRefManager, rulesetRefManager);
    
            case "group":
                return new GroupLayer(layerData, parent, tilesetRefManager, rulesetRefManager);
    
            default:
                return null;
        }
    }
}