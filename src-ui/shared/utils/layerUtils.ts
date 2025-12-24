import { BaseLayer, IGroupLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";

import { LayerData } from "../schema/layerSchema";

export class LayerUtils {
    public static createLayeFromData(layerData: LayerData, parent: IGroupLayer): BaseLayer | null {
        let layer: BaseLayer<any> | null = null;
        switch (layerData.layerType) {
            case "tile":
                layer = new TileLayer(layerData, parent);
                break;
            case "group":
                layer = new GroupLayer(layerData, parent);
        }
        return layer;
    }
}