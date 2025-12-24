// src-ui/view/stores/application/tilemapSessionStore.ts
import { Application } from "pixi.js";
import { create } from "zustand";

import { TilemapSession } from "@/core/application/session/tilemapSession";
import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { WorkspaceService } from "@/shared/services/workspaceService";
import { TilemapSessionView } from "@/view/models/tilemapSessionView";

type TilemapSessionDisplayData = {
    name: string;
    sessionId: string;
}

type TilemapViewStore = {
    pixiApp: Application | null;
    tilemapSessionMap: Map<string, TilemapSessionView>;
    tilemapsSession: TilemapSessionDisplayData[];
    currentSession: TilemapSessionView | null;

    setPixiApp: (pixiApp: Application) => void;
    setSessions: (session: TilemapSession[]) => void;
    openSession: (session: TilemapSession) => TilemapSessionView | null;
    closeSession(sessionId: string): void;
    clear(): void;
}

export const useTilemapSessionStore = create<TilemapViewStore>((set, get) => {
    return {
        pixiApp: null,
        tilemapSessionMap: new Map<string, TilemapSessionView>(),
        tilemapsSession: [],
        currentSession: null,

        layers: [],
        activeLayerId: null,

        setPixiApp: (pixiApp: Application) => {
            set({ pixiApp })
            const currentSession = get().currentSession;
            if (currentSession) currentSession.activateSession(pixiApp);
        },

        setSessions: (session: TilemapSession[]) => {
            get().tilemapSessionMap.forEach(sessionView => sessionView.destroy());
            get().tilemapSessionMap.clear();
            set({ tilemapsSession: [], currentSession: null });
            
            session.forEach(session => {
                const sessionView = new TilemapSessionView(session);
                get().tilemapSessionMap.set(session.id, sessionView);
                set({ 
                    tilemapsSession: [...get().tilemapsSession, { name: session.tilemap.name, sessionId: session.id }], 
                    currentSession: sessionView 
                });
            });

            WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        },

        openSession: (session: TilemapSession) => {
            let sessionView: TilemapSessionView;
            if (get().tilemapSessionMap.has(session.id)) {
                sessionView = get().tilemapSessionMap.get(session.id)!;
            } else {
                sessionView = new TilemapSessionView(session);
                get().tilemapSessionMap.set(session.id, sessionView);
                set({ tilemapsSession: [...get().tilemapsSession, { name: session.tilemap.name, sessionId: session.id }] });
            }
            
            const currentSession = get().currentSession;
            if (currentSession && currentSession !== sessionView) {
                currentSession.unActivateSession();
            } else if (currentSession) {
                currentSession.unActivateSession();
            }

            const pixiApp = get().pixiApp;
            if (pixiApp) sessionView.activateSession(pixiApp);
            
            set({ currentSession: sessionView });
            TilemapLayerService.setLayersFromTilemap(session.tilemap);
            WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
            return sessionView;
        },

        closeSession: (sessionId: string) => {
            const sessionView = get().tilemapSessionMap.get(sessionId);
            const currentSession = get().currentSession;
            if (sessionView) {
                if (currentSession === sessionView) {
                    sessionView.unActivateSession();
                    set({ currentSession: null });
                }
                sessionView.destroy();
                get().tilemapSessionMap.delete(sessionId);
                set((state) => {
                    return { tilemapsSession: [...state.tilemapsSession.filter((s) => s.sessionId !== sessionId)] };
                });
            }
            TilemapLayerService.clearLayers();
            WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        },

        clear: () => {
            get().tilemapSessionMap.forEach(sessionView => sessionView.destroy());
            get().tilemapSessionMap.clear();
            set({ currentSession: null, tilemapsSession: [] });
        }
    }
});