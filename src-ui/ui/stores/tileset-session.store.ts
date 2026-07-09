import { Application } from "pixi.js";
import { create } from "zustand";
import { TilesetSession } from "@/editor/session/tileset.session";

type TilesetSessionDisplayData = {
    sessionId: string;
    name: string;
}

type TilesetSessionState = {
    pixiApp: Application | null;
    tilesetSessions: TilesetSessionDisplayData[];
    activeSession: TilesetSession | null;
}

type TilesetSessionActions = {
    setPixiApp: (pixiApp: Application) => void;
    setTilesetSessions: (tilesetSessions: TilesetSessionDisplayData[]) => void;
    setActiveSession: (session: TilesetSession | null) => void;
}

type TilesetSessionStore = TilesetSessionState & {
    actions: TilesetSessionActions;
}

const useTilesetSessionStore = create<TilesetSessionStore>((set) => {
    return {
        pixiApp: null,
        tilesetSessions: [],
        activeSession: null,

        actions: {
            setPixiApp: (pixiApp) => { set({ pixiApp }) },
            setTilesetSessions: (tilesetSessions) => { set({ tilesetSessions }) },
            setActiveSession: (session) => { set({ activeSession: session }) },
        },
    }
});

export const useTilesetPixiApp = () => useTilesetSessionStore((state) => state.pixiApp);
export const useTilesetSessions = () => useTilesetSessionStore((state) => state.tilesetSessions);
export const useActiveTilesetSession = () => useTilesetSessionStore((state) => state.activeSession);
export const useTilesetSessionActions = () => useTilesetSessionStore((state) => state.actions);

export const getTilesetSessionStoreState = () => useTilesetSessionStore.getState();
export const resetTilesetSessionStoreForTest = () => useTilesetSessionStore.setState(useTilesetSessionStore.getInitialState(), true);
export const setTilesetSessionStoreStateForTest = (state: Partial<TilesetSessionState>) => useTilesetSessionStore.setState(state);
