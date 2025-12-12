import { create } from "zustand";

import { TilesetViewSession } from "@/core/application/session/tilesetViewSession";

type TilesetSessionDisplayData = {
    name: string;
    sessionId: string;
}

type TilesetViewStore = {
    currentTilesetViewSession: TilesetViewSession | null;
    tilesetsViewSession: TilesetSessionDisplayData[];
    setCurrentTilesetViewSesison: (tilesetSession: TilesetViewSession) => void;
    setTilesetsViewSession: (tilesetsViewSession: TilesetSessionDisplayData[]) => void;
    addTilesetViewSession: (tileset: TilesetSessionDisplayData) => void;
}

export const useTilesetViewStore = create<TilesetViewStore>((set, get) => {
    return {
        currentTilesetViewSession: null,
        setCurrentTilesetViewSesison: (tileset: TilesetViewSession) => set({ currentTilesetViewSession: tileset }),
        tilesetsViewSession: [],
        setTilesetsViewSession: (tilesetsViewSession: TilesetSessionDisplayData[]) => set({ tilesetsViewSession }),
        addTilesetViewSession: (tileset: TilesetSessionDisplayData) => {
            if (get().tilesetsViewSession.find((tilesetViewSession) => tilesetViewSession.sessionId === tileset.sessionId)) return;
            set((state) => {
                return { tilesetsViewSession: [...state.tilesetsViewSession, tileset] };
            })
        }
    };
});