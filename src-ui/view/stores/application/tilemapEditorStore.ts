import { create } from "zustand";

export type TilemapDisplayData = {
    name: string;
    id: string;
}

type TilemapEditorStore = {
    currentTilemap: TilemapDisplayData | null;
    tilemmaps: TilemapDisplayData[];
    setCurrentTilemap: (tilemap: TilemapDisplayData) => void;
    setTilemaps: (tilemmaps: TilemapDisplayData[]) => void;
    addTilemap: (tilemap: TilemapDisplayData) => void;
}

export const useTilemapEditorStore = create<TilemapEditorStore>((set, get) => ({
    currentTilemap: null,
    setCurrentTilemap: (tilemap: TilemapDisplayData) => set({ currentTilemap: tilemap }),
    tilemmaps: [],
    setTilemaps: (tilemmaps: TilemapDisplayData[]) => set({ tilemmaps }),
    addTilemap: (tilemap: TilemapDisplayData) => {
        set((state) => {
            return { tilemmaps: [...state.tilemmaps, tilemap] };
        })
    }
}));