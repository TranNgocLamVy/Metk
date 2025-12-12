import { create } from "zustand";

import { TilesetSession } from "@/core/application/session/tilesetSession";

type TilesetSessionDisplayData = {
    name: string;
    sessionId: string;
}

type TilesetViewStore = {
    currentTilesetSession: TilesetSession | null;
    tilesetsSession: TilesetSessionDisplayData[];
    setCurrentTilesetViewSesison: (tilesetSession: TilesetSession) => void;
    setTilesetsSession: (tilesetsSession: TilesetSessionDisplayData[]) => void;
    addTilesetSession: (tileset: TilesetSessionDisplayData) => void;
}

export const useTilesetSessionStore = create<TilesetViewStore>((set, get) => {
    return {
        currentTilesetSession: null,
        setCurrentTilesetViewSesison: (tileset: TilesetSession) => set({ currentTilesetSession: tileset }),
        tilesetsSession: [],
        setTilesetsSession: (tilesetsSession: TilesetSessionDisplayData[]) => set({ tilesetsSession }),
        addTilesetSession: (tileset: TilesetSessionDisplayData) => {
            if (get().tilesetsSession.find((tilesetSession) => tilesetSession.sessionId === tileset.sessionId)) return;
            set((state) => {
                return { tilesetsSession: [...state.tilesetsSession, tileset] };
            })
        }
    };
});