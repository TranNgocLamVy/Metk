// src-ui/view/stores/application/tilemapSessionStore.ts
import { Application } from "pixi.js";
import { create } from "zustand";

import { appCore } from "@/core/appcore";
import { TilemapSessionManager } from "@/core/manager/tilemapSessionManager";

type TilemapSessionDisplayData = {
    name: string;
    sessionId: string;
    isDirty: boolean;
}

type TilemapViewStore = {
    pixiApp: Application | null;
    version: number;

    setPixiApp: (pixiApp: Application) => void;
    getTileamapDisplayData: () => TilemapSessionDisplayData[];
    getCurrentTilemapSessionId: () => string | null;
    refresh: () => void;

}

export const useTilemapSessionStore = create<TilemapViewStore>((set, get) => {
    return {
        pixiApp: null,
        version: 0,

        setPixiApp: (pixiApp: Application) => {
            set({ pixiApp })
        },
        getTileamapDisplayData: () => {
            const tilemapSessionManager = appCore.workspaceManager.currentWorkspace?.tilemapSessionManager;
            if (!tilemapSessionManager) return [];
            return tilemapSessionManager.tilemapsSession.map(session => ({ name: session.tilemap.name, sessionId: session.id, isDirty: session.isDirty }));
        },
        getCurrentTilemapSessionId: () => {
            const tilemapSessionManager = appCore.workspaceManager.currentWorkspace?.tilemapSessionManager;
            if (!tilemapSessionManager) return null;
            return tilemapSessionManager.currentTilemapSession?.id || null;
        },
        refresh: () => set((state) => ({ version: (state.version + 1) % 100000 })),
    }
});