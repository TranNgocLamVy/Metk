import { v4 as uuidv4 } from "uuid";

import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

export class TilemapLayerService {
    public static async createNewTileLayer() {
        const root = useLayerManagerStore.getState().root;
        if (!root) return;

        const targetLayer = useLayerManagerStore.getState().targetLayer;

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const newTileLayer = new TileLayer({
            id: uuidv4(),
            name: "New Tile Layer",
            layerType: "tile",
            width: root.tilemap.width,
            height: root.tilemap.height,
            opacity: 1,
            visible: true,
            locked: false,
            tilesData: []
        }, parent, parent.tilesetRefManager)

        parent.addLayer(newTileLayer);
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        useLayerManagerStore.getState().setEditingId(newTileLayer.id);
        useLayerManagerStore.getState().refresh()
    }

    public static async createNewGroupLayer() {
        const root = useLayerManagerStore.getState().root;
        if (!root) return;

        const targetLayer = useLayerManagerStore.getState().targetLayer;

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const newGroupLayer = new GroupLayer({
            id: uuidv4(),
            name: "New Group Layer",
            layerType: "group",
            opacity: 1,
            visible: true,
            locked: false,
            layers: []
        }, parent, parent.tilesetRefManager)

        parent.addLayer(newGroupLayer);
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        useLayerManagerStore.getState().setEditingId(newGroupLayer.id);
        useLayerManagerStore.getState().refresh()
    }

    public static async deleteLayer() {
        const root = useLayerManagerStore.getState().root;
        if (!root) return;
    
        const selectedIds = useLayerManagerStore.getState().selectedIds
        selectedIds.forEach((id) => {
            const layer = root.findLayer(id);
            layer?.removeFromParent();
        })
    
        useLayerManagerStore.getState().refresh();
    }
}