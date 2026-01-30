import { create } from "zustand";

type DisplayData = {
    name: string;
    id: string;
}

type ExplorerStore = {
    tilesets: DisplayData[];
    tilemaps: DisplayData[];
    setTilesets: (tilesets: DisplayData[]) => void;
    setTilemaps: (tilemaps: DisplayData[]) => void;
    addTileset: (tileset: DisplayData) => void;
    addTilemap: (tilemap: DisplayData) => void;
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