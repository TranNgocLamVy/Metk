import { Application } from "pixi.js";
import { create } from "zustand";

import { TilesetSession } from "@/core/application/session/tilesetSession";
import { TilesetSessionView } from "@/view/manager/tilesetSessionView";

type TilesetSessionDisplayData = {
    name: string;
    sessionId: string;
}

type TilesetViewStore = {
    pixiApp: Application | null;
    tilesetSessionMap: Map<string, TilesetSessionView>; // sessionId -> sessionView
    tilesetsSession: TilesetSessionDisplayData[];
    currentSession: TilesetSessionView | null;
    setPixiApp: (pixiApp: Application) => void;
    setSessions:(session: TilesetSession[]) => void;
    openSession:(session: TilesetSession) => TilesetSessionView | null;
    closeSession(sessionId: string): void;
    clear(): void;
}

export const useTilesetSessionStore = create<TilesetViewStore>((set, get) => {
    return {
        pixiApp: null,
        tilesetSessionMap: new Map<string, TilesetSessionView>(),
        tilesetsSession: [],
        currentSession: null,
        setPixiApp: (pixiApp: Application) => {
            set({ pixiApp })
            const currentSession = get().currentSession;
            if (currentSession) currentSession.activateSession(pixiApp);
        },
        setSessions: (session: TilesetSession[]) => {
            get().tilesetSessionMap.forEach(sessionView => sessionView.destroy());
            get().tilesetSessionMap.clear();
            set({ tilesetsSession: [] });
            session.forEach(session => {
                const sessionView = new TilesetSessionView(session);
                get().tilesetSessionMap.set(session.id, sessionView);
                set({ tilesetsSession: [...get().tilesetsSession, { name: session.tileset.name, sessionId: session.id }], currentSession: sessionView });
            });
        },
        openSession: (session: TilesetSession) => {
            let sessionView: TilesetSessionView;
            if (get().tilesetSessionMap.has(session.id)) {
                sessionView = get().tilesetSessionMap.get(session.id)!;
            } else {
                sessionView = new TilesetSessionView(session);
                get().tilesetSessionMap.set(session.id, sessionView);
                set({ tilesetsSession: [...get().tilesetsSession, { name: session.tileset.name, sessionId: session.id }], currentSession: sessionView });
            }
            const currentSession = get().currentSession;
            if (currentSession) currentSession.unActivateSession();
            
            const pixiApp = get().pixiApp;
            if (pixiApp) sessionView.activateSession(pixiApp);

            set({ currentSession: sessionView });
            return sessionView;
        },
        closeSession: (sessionId: string) => {
            const sessionView = get().tilesetSessionMap.get(sessionId);
            const currentSession = get().currentSession;
            if (sessionView) {
                if (currentSession === sessionView) {
                    sessionView.unActivateSession();
                    set({ currentSession: null });
                }
                sessionView.destroy();
                get().tilesetSessionMap.delete(sessionId);
                set((state) => {
                    return { tilesetsSession: [...state.tilesetsSession.filter((tilesetSession) => tilesetSession.sessionId !== sessionId)] };
                });
            }
        },
        clear: () => {
            get().tilesetSessionMap.forEach(sessionView => sessionView.destroy());
            get().tilesetSessionMap.clear();
            get().tilesetsSession = [];
        }
    }
});