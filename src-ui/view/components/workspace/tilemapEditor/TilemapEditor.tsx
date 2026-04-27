
import { useWorkspaceStore } from "@/view/stores/useWorkspaceStore";
import { VStack } from "../../custom/stack/Stack";
import WorkspaceConsole from "../console/Console";
import ToolBar from "../ToolBar";
import TilemapEditorCanvas from "./TilemapEditorCanvas";
import TilemapEditorTabs from "./TilemapEditorTabs";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";
import { useCallback, useEffect, useRef } from "react";
import { TilemapSessionView } from "@/core/application/session/tilemapSessionView";
import { useTilemapSessionEvent } from "@/view/hooks/useTilemapSessionEvent";
import { appCore } from "@/core/appcore";

export default function TilemapEditor() {
    const { activeWorkspace } = useWorkspaceStore();
    const { pixiApp, setTilemapSessions } = useTilemapSessionStore();

    const activeSessionViewRef = useRef<{ id: string, view: TilemapSessionView } | null>(null);
    const sessionViewRefMap = useRef<Map<string, TilemapSessionView>>(new Map());

    const updateTilemapSessionList = useCallback(() => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        if (!activeWorkspace) return;

        const tilemapSessionManager = activeWorkspace.tilemapSessionManager
        const sessionList = tilemapSessionManager.tilemapsSession.map(session => ({ name: session.tilemap.name, sessionId: session.id, isDirty: session.isDirty }));
        setTilemapSessions(sessionList);
    }, [])

    const activateSessionView = useCallback((sessionView: TilemapSessionView) => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        const pixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!activeWorkspace || !pixiApp) return;

        const toolManager = appCore.toolManager;
        const tilemapSessionManager = activeWorkspace.tilemapSessionManager;

        sessionView.activateSession(pixiApp);
        activeSessionViewRef.current = { id: sessionView.session.id, view: sessionView };

        tilemapSessionManager.registerView(sessionView);
        toolManager.setActiveSession(sessionView.session, sessionView);

        sessionView.session.on("onMarkChange", updateTilemapSessionList);

        useTilemapSessionStore.getState().setActiveSession(sessionView.session);
    }, [])

    const deactivateCurrentSessionView = useCallback(() => {
        const activeSessionView = activeSessionViewRef.current;
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        
        if (!activeWorkspace || !activeSessionView) return;

        activeSessionView.view.unActivateSession();
        activeSessionViewRef.current = null;

        const toolManager = appCore.toolManager;
        toolManager.setActiveSession(null, null);

        const tilemapSessionManager = activeWorkspace!.tilemapSessionManager;
        tilemapSessionManager.unregisterView();

        activeSessionView.view.session.off("onMarkChange", updateTilemapSessionList);

        useTilemapSessionStore.getState().setActiveSession(null);
    }, [])


    useEffect(() => {
        if (!activeWorkspace || !pixiApp) return;

        const toolManager = appCore.toolManager;
        const tilemapSessionManager = activeWorkspace.tilemapSessionManager;
        const currentSession = tilemapSessionManager.currentTilemapSession;

        if (currentSession) {
            const newSessionView = new TilemapSessionView(currentSession);
            sessionViewRefMap.current.set(currentSession.id, newSessionView);
            activateSessionView(newSessionView);
        }

        updateTilemapSessionList();

        return () => {
            sessionViewRefMap.current.forEach((sessionView) => {
                sessionView.destroy();
            })
            sessionViewRefMap.current.clear();

            activeSessionViewRef.current?.view.session.off("onMarkChange", updateTilemapSessionList);
            activeSessionViewRef.current = null;

            tilemapSessionManager.unregisterView();
            toolManager.setActiveSession(null, null);
        }
    }, [activeWorkspace, pixiApp])

    useTilemapSessionEvent("onOpenTilemapSession", (session) => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        const pixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!activeWorkspace || !pixiApp) return;

        const activeSessionView = activeSessionViewRef.current;
        if (activeSessionView && session.id === activeSessionView.id) return;
        if (activeSessionView) deactivateCurrentSessionView();

        let newCurrentSessionView = sessionViewRefMap.current.get(session.id);
        if (!newCurrentSessionView) {
            newCurrentSessionView = new TilemapSessionView(session);
            sessionViewRefMap.current.set(session.id, newCurrentSessionView);
        }

        activateSessionView(newCurrentSessionView);
    })

    useTilemapSessionEvent("onCreateTilemapSession", (session) => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        const pixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!activeWorkspace || !pixiApp) return;

        if (sessionViewRefMap.current.has(session.id)) return;
        const newSessionView = new TilemapSessionView(session);
        sessionViewRefMap.current.set(session.id, newSessionView);
        
        updateTilemapSessionList();
    })

    useTilemapSessionEvent("onCloseTilemapSession", (sessionId) => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        const pixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!activeWorkspace || !pixiApp) return;

        const activeSessionView = activeSessionViewRef.current;
        if (activeSessionView && sessionId === activeSessionView.id) deactivateCurrentSessionView();

        const sessionView = sessionViewRefMap.current.get(sessionId);
        if (sessionView) sessionView.destroy();
        sessionViewRefMap.current.delete(sessionId);

        updateTilemapSessionList();
    })

    return (
        <VStack className="tilemapeditor w-full h-full relative">
            <TilemapEditorTabs />
            <ToolBar />
            <TilemapEditorCanvas />
            <WorkspaceConsole />
        </VStack>
    );
}