import { v4 as uuidv4 } from "uuid";

import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";
import { useTilemapLayerStore } from "@/view/stores/application/tilemapLayerStore";

export class TilemapLayerService {
    public static async setLayersFromTilemap(tilemap: Tilemap) {
        const layers = tilemap.rootLayer.getLayers();
        useTilemapLayerStore.getState().setLayers(layers.map(layer => ({ id: layer.id, name: layer.getName() })));
    }

    public static async clearLayers() {
        useTilemapLayerStore.getState().setLayers([]);
        useTilemapLayerStore.getState().setActiveLayer(null);
    }

    public static async createLayer(name: string, tilemap: Tilemap) {
        const newTilelayer = new TileLayer({
            id: uuidv4(),
            layerType: "tile",
            name: name,
            width: tilemap.width,
            height: tilemap.height,
            visible: true,
            opacity: 1,
            locked: false,
            tilesData: Array.from({ length: tilemap.height }, () => Array.from({ length: tilemap.width }, () => null)),
        }, tilemap.rootLayer);

        const result = tilemap.rootLayer.addLayer(newTilelayer, 0);
        if (result.status != "Success" || !result.data) return;
        useTilemapLayerStore.getState().addLayer({ id: newTilelayer.id, name: newTilelayer.getName() });
    }
}