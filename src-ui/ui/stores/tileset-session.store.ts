import { Application } from "pixi.js";
import { create } from "zustand";
import { TilesetSession } from "@/editor/session/tileset.session";

type TilesetSessionDisplayData = {
    sessionId: string;
    name: string;
}

type TilesetViewStore = {
    pixiApp: Application | null;
    tilesetSessions: TilesetSessionDisplayData[];
    activeSession: TilesetSession | null;

    setPixiApp: (pixiApp: Application) => void;
    setTilesetSessions: (tilesetSessions: TilesetSessionDisplayData[]) => void;
    setActiveSession: (session: TilesetSession | null) => void;
}

export const useTilesetSessionStore = create<TilesetViewStore>((set, get) => {
    return {
        pixiApp: null,
        tilesetSessions: [],
        activeSession: null,

        setPixiApp: (pixiApp: Application) => { set({ pixiApp }) },
        setTilesetSessions: (tilesetSessions: TilesetSessionDisplayData[]) => { set({ tilesetSessions }) },
        setActiveSession: (session: TilesetSession | null) => { set({ activeSession: session }) },
    }
});