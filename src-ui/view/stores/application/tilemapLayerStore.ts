import { create } from "zustand";

type LayerDisplayData = {
    id: string;
    name: string;
}

type TilemapLayerStore = {
    activeLayerId: string | null;
    layers: LayerDisplayData[];
    setActiveLayer: (layerId: string | null) => void;
    setLayers: (layers: LayerDisplayData[]) => void;
    addLayer: (layer: LayerDisplayData) => void;
    removeLayer: (layerId: string) => void;
}

export const useTilemapLayerStore = create<TilemapLayerStore>((set, get) => {
    return {
        activeLayerId: null,
        layers: [],
        setActiveLayer: (layerId: string | null) => {
            set({ activeLayerId: layerId });
        },
        setLayers: (layers: LayerDisplayData[]) => {
            set({ layers });
        },
        addLayer: (layer: LayerDisplayData) => {
            set({ layers: [...get().layers, layer] });
        },
        removeLayer: (layerId: string) => {
            set({ layers: get().layers.filter(layer => layer.id !== layerId) });
        },
    }
});