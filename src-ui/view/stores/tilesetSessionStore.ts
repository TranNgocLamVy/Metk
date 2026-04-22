import { Application } from "pixi.js";
import { create } from "zustand";

import { appCore } from "@/core/appcore";

type TilesetSessionDisplayData = {
    sessionId: string;
    name: string;
}

type TilesetViewStore = {
    pixiApp: Application | null;
    version: number;
    
    setPixiApp: (pixiApp: Application) => void;
    getTilesetDisplayData: () => TilesetSessionDisplayData[];
    getCurrentTilesetSessionId: () => string | null;
    refresh: () => void;
}

export const useTilesetSessionStore = create<TilesetViewStore>((set, get) => {
    return {
        version: 0,
        pixiApp: null,

        setPixiApp: (pixiApp: Application) => {
            set({ pixiApp })
            const tilesetSessionManager = appCore.workspaceManager.currentWorkspace?.tilesetSessionManager;
            if (!tilesetSessionManager) return;
            const currentSession = tilesetSessionManager.currentTilesetSession;
            if (currentSession) currentSession.sessionView.activateSession(pixiApp);
        },
        getTilesetDisplayData: () => {
            const tilesetSessionManager = appCore.workspaceManager.currentWorkspace?.tilesetSessionManager;
            if (!tilesetSessionManager) return [];
            return tilesetSessionManager.tilesetsSession.map(session => ({ sessionId: session.id, name: session.tileset.name }));
        },
        getCurrentTilesetSessionId: () => {
            const tilesetSessionManager = appCore.workspaceManager.currentWorkspace?.tilesetSessionManager;
            if (!tilesetSessionManager) return null;
            return tilesetSessionManager.currentTilesetSession?.id || null;
        },
        refresh: () => set((state) => ({ version: (state.version + 1) % 100000 })),
    }
});