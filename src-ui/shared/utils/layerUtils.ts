import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";

import { GroupLayerData, LayerData, RuleLayerData, TileLayerData } from "../schema/layer.schema";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";

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