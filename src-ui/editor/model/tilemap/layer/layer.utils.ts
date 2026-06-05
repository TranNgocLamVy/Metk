import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { EntityLayerData, GroupLayerData, ImageLayerData, LayerData, RuleLayerData, TileLayerData } from "../../../../shared/data-types/layer.data";
import { validate } from "../../../../shared/utils/validate.utils";

export class LayerUtils {
    public static createLayerFromData(layerData: LayerData, parent: IGroupLayer, tilemap: Tilemap, objectIdScope: string): BaseLayer<any> | null {
        const data = validate.object<Record<string, unknown>>({ value: layerData, defaultValue: {} });

        try {
            switch (data.type) {
                case "tile":
                    return new TileLayer(data as TileLayerData, parent, tilemap, objectIdScope);
                case "rule":
                    return new RuleLayer(data as RuleLayerData, parent, tilemap, objectIdScope);
                case "image":
                    return new ImageLayer(data as ImageLayerData, parent, tilemap, objectIdScope);
                case "entity":
                    return new EntityLayer(data as EntityLayerData, parent, tilemap, objectIdScope);
                case "group":
                    return new GroupLayer(data as GroupLayerData, parent, tilemap, objectIdScope);
                default:
                    return null;
            }
        } catch (error) {
            console.warn(`Skipping invalid layer: ${String(error)}`);
            return null;
        }
    }
}
