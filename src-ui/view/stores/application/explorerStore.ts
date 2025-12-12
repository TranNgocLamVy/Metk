import { create } from "zustand";

type TilesetDisplayData = {
    name: string;
    id: string;
}

type ExplorerStore = {
    tilesets: TilesetDisplayData[];
    setTilesets: (tilesets: TilesetDisplayData[]) => void;
    addTileset: (tileset: TilesetDisplayData) => void;
}

export const useExplorerStore = create<ExplorerStore>((set, get) => ({
    tilesets: [],
    setTilesets: (tilesets: TilesetDisplayData[]) => set({ tilesets }),
    addTileset: (tileset: TilesetDisplayData) => {
        set((state) => {
            return { tilesets: [...state.tilesets, tileset] };
        })
    }
}));