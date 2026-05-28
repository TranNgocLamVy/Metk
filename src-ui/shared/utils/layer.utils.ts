import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { LayerData } from "../schema/layer.schema";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";

export class LayerUtils {
    public static createLayerFromData(layerData: LayerData, parent: IGroupLayer, tilemap: Tilemap, objectIdScope: string): BaseLayer<any> | null {
        switch (layerData.type) {
            case "tile":
                return new TileLayer(layerData, parent, tilemap, objectIdScope);

            case "auto_rule":
                return new RuleLayer(layerData, parent, tilemap, objectIdScope);

            case "image":
                return new ImageLayer(layerData, parent, tilemap, objectIdScope);

            case "group":
                return new GroupLayer(layerData, parent, tilemap, objectIdScope);

            default:
                return null;
        }
    }
}