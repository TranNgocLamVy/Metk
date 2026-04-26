
import { useWorkspaceStore } from "@/view/stores/useWorkspaceStore";
import { VStack } from "../../custom/stack/Stack";
import WorkspaceConsole from "../console/Console";
import ToolBar from "../ToolBar";
import TilemapEditorCanvas from "./TilemapEditorCanvas";
import TilemapEditorTabs from "./TilemapEditorTabs";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";
import { useEffect, useRef } from "react";
import { TilemapSessionView } from "@/core/application/session/tilemapSessionView";
import { useTilemapSessionEvent } from "@/view/hooks/useTilemapSessionEvent";
import { appCore } from "@/core/appcore";

export default function TilemapEditor() {
    const { activeWorkspace } = useWorkspaceStore();
    const { pixiApp } = useTilemapSessionStore();

    const activeSessionViewRef = useRef<{ id: string, view: TilemapSessionView } | null>(null);
    const sessionViewRefMap = useRef<Map<string, TilemapSessionView>>(new Map());

    useEffect(() => {
        if (!activeWorkspace || !pixiApp) return;

        const toolManager = appCore.toolManager;
        const tilemapSessionManager = activeWorkspace.tilemapSessionManager;
        const activeSession = tilemapSessionManager.currentTilemapSession;

        if (activeSession) {
            const newSessionView = new TilemapSessionView(activeSession);
            newSessionView.activateSession(pixiApp);

            sessionViewRefMap.current.set(activeSession.id, newSessionView);
            activeSessionViewRef.current = { id: activeSession.id, view: newSessionView };


            tilemapSessionManager.registerView(newSessionView);
            toolManager.setActiveSession(activeSession, newSessionView);
        }

        return () => {
            sessionViewRefMap.current.forEach((sessionView) => {
                sessionView.unActivateSession();
                sessionView.destroy();
            })
            sessionViewRefMap.current.clear();
            activeSessionViewRef.current = null;

            tilemapSessionManager.unregisterView();
            toolManager.setActiveSession(null, null);
        }
    }, [activeWorkspace, pixiApp])

    useTilemapSessionEvent("onOpenTilemapSession", (session) => {
        console.log("onOpenSession")
        const activeSessionView = activeSessionViewRef.current;
        if (activeSessionView && session.id === activeSessionView.id) return;
        if (activeSessionView) {
            activeSessionView.view.unActivateSession()
            activeSessionViewRef.current = null;
        }

        const newCurrentSessionView = sessionViewRefMap.current.has(session.id) ? sessionViewRefMap.current.get(session.id)! : new TilemapSessionView(session);
        sessionViewRefMap.current.set(session.id, newCurrentSessionView);
        newCurrentSessionView.activateSession(pixiApp!);
        activeSessionViewRef.current = { id: session.id, view: newCurrentSessionView };

        const toolManager = appCore.toolManager;
        toolManager.setActiveSession(session, newCurrentSessionView);

        const tilemapSessionManager = activeWorkspace!.tilemapSessionManager;
        tilemapSessionManager.registerView(newCurrentSessionView);
    })

    useTilemapSessionEvent("onCreateTilemapSession", (session) => {
        console.log("onCreateSession")
        if (sessionViewRefMap.current.has(session.id)) return;
        const newSessionView = new TilemapSessionView(session);
        sessionViewRefMap.current.set(session.id, newSessionView);
    })

    useTilemapSessionEvent("onCloseTilemapSession", (sessionId) => {
        console.log("onCloseSession")
        const activeSessionView = activeSessionViewRef.current;
        if (activeSessionView && sessionId === activeSessionView.id) {
            activeSessionViewRef.current = null;

            const toolManager = appCore.toolManager;
            toolManager.setActiveSession(null, null);
            
            const tilemapSessionManager = activeWorkspace!.tilemapSessionManager;
            tilemapSessionManager.unregisterView();
        }
        const sessionView = sessionViewRefMap.current.get(sessionId);
        if (sessionView) sessionView.destroy();
        sessionViewRefMap.current.delete(sessionId);
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