// src-ui/view/stores/application/explorerStore.ts
import { create } from "zustand";

type DisplayData = {
    name: string;
    id: string;
}

type ExplorerStore = {
    tilesets: DisplayData[];
    tilemaps: DisplayData[]; // [ADD]
    setTilesets: (tilesets: DisplayData[]) => void;
    setTilemaps: (tilemaps: DisplayData[]) => void; // [ADD]
    addTileset: (tileset: DisplayData) => void;
    addTilemap: (tilemap: DisplayData) => void; // [ADD]
}

export const useExplorerStore = create<ExplorerStore>((set, get) => ({
    tilesets: [],
    tilemaps: [],
    setTilesets: (tilesets: DisplayData[]) => set({ tilesets }),
    setTilemaps: (tilemaps: DisplayData[]) => set({ tilemaps }),
    addTileset: (tileset: DisplayData) => {
        set((state) => {
            return { tilesets: [...state.tilesets, tileset] };
        })
    },
    addTilemap: (tilemap: DisplayData) => {
        set((state) => {
            return { tilemaps: [...state.tilemaps, tilemap] };
        })
    }
}));