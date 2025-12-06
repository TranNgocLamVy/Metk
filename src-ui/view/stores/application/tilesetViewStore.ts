import { create } from "zustand";

export type TilesetDisplayData = {
    name: string;
    id: string;
}

type TilesetViewStore = {
    currentTileset: TilesetDisplayData | null;
    tilesets: TilesetDisplayData[];
    setCurrentTileset: (tileset: TilesetDisplayData) => void;
    setTilesets: (tilesets: TilesetDisplayData[]) => void;
    addTileset: (tileset: TilesetDisplayData) => void;
}

export const useTilesetViewStore = create<TilesetViewStore>((set, get) => ({
    currentTileset: null,
    setCurrentTileset: (tileset: TilesetDisplayData) => set({ currentTileset: tileset }),
    tilesets: [],
    setTilesets: (tilesets: TilesetDisplayData[]) => set({ tilesets }),
    addTileset: (tileset: TilesetDisplayData) => {
        set((state) => {
            return { tilesets: [...state.tilesets, tileset] };
        })
    }
}));