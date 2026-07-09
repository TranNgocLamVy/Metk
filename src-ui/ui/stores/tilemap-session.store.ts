import { Application } from "pixi.js";
import { create } from "zustand";

import { TilemapSession } from "@/editor/session/tilemap.session";

type TilemapSessionDisplayData = {
    name: string;
    sessionId: string;
    isDirty: boolean;
}

type TilemapSessionState = {
    pixiApp: Application | null;
    tilemapSessions: TilemapSessionDisplayData[];
    activeSession: TilemapSession | null;
}

type TilemapSessionActions = {
    setPixiApp: (pixiApp: Application) => void;
    setTilemapSessions: (tilemapSessions: TilemapSessionDisplayData[]) => void;
    setActiveSession: (session: TilemapSession | null) => void;
}

type TilemapSessionStore = TilemapSessionState & {
    actions: TilemapSessionActions;
}

const useTilemapSessionStore = create<TilemapSessionStore>((set) => {
    return {
        pixiApp: null,
        tilemapSessions: [],
        activeSession: null,

        actions: {
            setPixiApp: (pixiApp) => { set({ pixiApp }) },
            setTilemapSessions: (tilemapSessions) => { set({ tilemapSessions }) },
            setActiveSession: (session) => { set({ activeSession: session }) },
        },
    }
});

export const useTilemapPixiApp = () => useTilemapSessionStore((state) => state.pixiApp);
export const useTilemapSessions = () => useTilemapSessionStore((state) => state.tilemapSessions);
export const useActiveTilemapSession = () => useTilemapSessionStore((state) => state.activeSession);
export const useTilemapSessionActions = () => useTilemapSessionStore((state) => state.actions);

export const getTilemapSessionStoreState = () => useTilemapSessionStore.getState();
export const resetTilemapSessionStoreForTest = () => useTilemapSessionStore.setState(useTilemapSessionStore.getInitialState(), true);
export const setTilemapSessionStoreStateForTest = (state: Partial<TilemapSessionState>) => useTilemapSessionStore.setState(state);
