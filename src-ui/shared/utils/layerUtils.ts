import { BaseLayer, IGroupLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";

import { GroupLayerData, LayerData, TileLayerData } from "../schema/layerSchema";

export class LayerUtils {
    public static createLayeFromData(layerData: LayerData, parent: IGroupLayer, tilesetRefManager: TilesetRefManager): BaseLayer | null {
        let layer: BaseLayer<any> | null = null;
        switch (layerData.type) {
            case "tile":
                layer = new TileLayer(layerData as TileLayerData, parent, tilesetRefManager);
                break;
            case "group":
                layer = new GroupLayer(layerData as GroupLayerData, parent, tilesetRefManager);
                break;
        }
        return layer;
    }
}