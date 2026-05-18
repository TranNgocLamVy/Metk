import { Application } from "pixi.js";
import { create } from "zustand";

import { TilemapSession } from "@/editor/application/session/tilemapSession";

type TilemapSessionDisplayData = {
    name: string;
    sessionId: string;
    isDirty: boolean;
}

type TilemapSessionState = {
    pixiApp: Application | null;
    tilemapSessions: TilemapSessionDisplayData[];
    activeSession: TilemapSession | null;

    setPixiApp: (pixiApp: Application) => void;
    setTilemapSessions: (tilemapSessions: TilemapSessionDisplayData[]) => void;
    setActiveSession: (session: TilemapSession | null) => void;
}

export const useTilemapSessionStore = create<TilemapSessionState>((set, get) => {
    return {
        pixiApp: null,
        tilemapSessions: [],
        activeSession: null,

        setPixiApp: (pixiApp: Application) => { set({ pixiApp }) },
        setTilemapSessions: (tilemapSessions: TilemapSessionDisplayData[]) => { set({ tilemapSessions }) },
        setActiveSession: (session: TilemapSession | null) => { set({ activeSession: session }) },
    }
});