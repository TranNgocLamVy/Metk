import { Application } from "pixi.js";
import { create } from "zustand";

import { appCore } from "@/core/appcore";

type TilemapSessionDisplayData = {
    name: string;
    sessionId: string;
    isDirty: boolean;
}

type TilemapEditorState = {
    pixiApp: Application | null;
    tilemapSessions: TilemapSessionDisplayData[];
    currentTilemapSessionId: string | null;
    version: number;

    setPixiApp: (pixiApp: Application) => void;
    setTilemapSessions: (tilemapSessions: TilemapSessionDisplayData[]) => void;
    setCurrentTilemapSessionId: (sessionId: string | null) => void;

    refresh: () => void;

}

export const useTilemapEditorSessionStore = create<TilemapEditorState>((set, get) => {
    return {
        pixiApp: null,
        tilemapSessions: [],
        currentTilemapSessionId: null,
        version: 0,

        setPixiApp: (pixiApp: Application) => {
            set({ pixiApp })
        },
        setTilemapSessions: (tilemapSessions: TilemapSessionDisplayData[]) => {
            set({ tilemapSessions })
        },
        setCurrentTilemapSessionId: (sessionId: string | null) => {
            set({ currentTilemapSessionId: sessionId })
        },

        refresh: () => set((state) => ({ version: (state.version + 1) % 100000 })),
    }
});