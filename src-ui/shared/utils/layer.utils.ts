import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";

import { LayerData } from "../schema/layer.schema";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";

export class LayerUtils {
    public static createLayerFromData(layerData: LayerData, parent: IGroupLayer, tilesetRefManager: TilesetRefManager, rulesetRefManager: RulesetRefManager, objectIdScope: string): BaseLayer<any> | null {
        switch (layerData.type) {
            case "tile":
                return new TileLayer(layerData, parent, tilesetRefManager, rulesetRefManager, objectIdScope);

            case "auto_rule":
                return new RuleLayer(layerData, parent, tilesetRefManager, rulesetRefManager, objectIdScope);

            case "image":
                return new ImageLayer(layerData, parent, tilesetRefManager, rulesetRefManager, objectIdScope);

            case "group":
                return new GroupLayer(layerData, parent, tilesetRefManager, rulesetRefManager, objectIdScope);

            default:
                return null;
        }
    }
}