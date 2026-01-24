// src-ui/view/stores/application/tilemapSessionStore.ts
import { Application } from "pixi.js";
import { create } from "zustand";

import { TilemapSessionManager } from "@/core/manager/tilemapSessionManager";
import { WorkspaceService } from "@/shared/services/workspaceService";

type TilemapSessionDisplayData = {
    name: string;
    sessionId: string;
    isDirty: boolean;
}

type TilemapViewStore = {
    pixiApp: Application | null;
    tilemapSessionManager: TilemapSessionManager | null;
    version: number;

    setPixiApp: (pixiApp: Application) => void;
    setTilemapSessionManager: (tilemapSessionManager: TilemapSessionManager) => void;
    getTileamapDisplayData: () => TilemapSessionDisplayData[];
    getCurrentTilemapSessionId: () => string | null;
    refresh: () => void;

}

export const useTilemapSessionStore = create<TilemapViewStore>((set, get) => {
    return {
        pixiApp: null,
        tilemapSessionManager: null,
        version: 0,

        setPixiApp: (pixiApp: Application) => {
            set({ pixiApp })
            const tilemapSessionManager = get().tilemapSessionManager;
            if (!tilemapSessionManager) return;
            const currentSession = tilemapSessionManager.currentTilemapSession;
            if (currentSession) currentSession.sessionView.activateSession(pixiApp);
        },

        setTilemapSessionManager: (tilemapSessionManager: TilemapSessionManager) => set({ tilemapSessionManager }), 
        getTileamapDisplayData: () => {
            const tilemapSessionManager = get().tilemapSessionManager;
            if (!tilemapSessionManager) return [];
            return tilemapSessionManager.tilemapsSession.map(session => ({ name: session.tilemap.name, sessionId: session.id, isDirty: session.isDirty }));
        },
        getCurrentTilemapSessionId: () => {
            const tilemapSessionManager = get().tilemapSessionManager;
            if (!tilemapSessionManager) return null;
            return tilemapSessionManager.currentTilemapSession?.id || null;
        },
        refresh: () => set((state) => ({ version: (state.version + 1) % 100000 })),
    }
});