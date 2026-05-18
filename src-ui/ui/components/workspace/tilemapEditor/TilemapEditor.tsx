
import { useWorkspaceStore } from "@/ui/stores/workspaceStore";
import { VStack } from "../../custom/stack/Stack";
import WorkspaceConsole from "../console/Console";
import ToolBar from "../ToolBar";
import TilemapEditorCanvas from "./TilemapEditorCanvas";
import TilemapEditorTabs from "./TilemapEditorTabs";
import { useTilemapSessionStore } from "@/ui/stores/tilemapSessionStore";
import { useCallback, useEffect, useRef } from "react";
import { TilemapView } from "@/graphics/view/tilemapView";
import { useTilemapSessionEvent } from "@/ui/hooks/useTilemapSessionEvent";
import { appCore } from "@/editor/appcore";

export default function TilemapEditor() {
    const { activeWorkspace } = useWorkspaceStore();
    const { pixiApp, activeSession, setTilemapSessions } = useTilemapSessionStore();

    const activeViewRef = useRef<{ id: string, view: TilemapView } | null>(null);
    const viewRefMap = useRef<Map<string, TilemapView>>(new Map());

    const updateTilemapSessionList = useCallback(() => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        if (!activeWorkspace) return;

        const tilemapSessionManager = activeWorkspace.tilemapSessionManager
        const sessionList = tilemapSessionManager.tilemapsSession.map(session => ({ name: session.tilemap.name, sessionId: session.id, isDirty: session.isDirty }));
        setTilemapSessions(sessionList);
    }, [])

    const activateView = useCallback((view: TilemapView) => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        const pixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!activeWorkspace || !pixiApp) return;

        const toolManager = appCore.toolManager;
        const tilemapSessionManager = activeWorkspace.tilemapSessionManager;

        view.activateView(pixiApp);
        activeViewRef.current = { id: view.session.id, view: view };

        tilemapSessionManager.registerActiveView(view);
        toolManager.setActiveSession(view);

        view.session.on("onMarkChange", updateTilemapSessionList);

        useTilemapSessionStore.getState().setActiveSession(view.session);
    }, [])

    const deactivateCurrentView = useCallback(() => {
        const activeView = activeViewRef.current;
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;

        if (!activeWorkspace || !activeView) return;

        activeView.view.unActivateView();
        activeViewRef.current = null;

        const toolManager = appCore.toolManager;
        toolManager.setActiveSession(null);

        const tilemapSessionManager = activeWorkspace!.tilemapSessionManager;
        tilemapSessionManager.unregisterActiveView();

        activeView.view.session.off("onMarkChange", updateTilemapSessionList);

        useTilemapSessionStore.getState().setActiveSession(null);
    }, [])

    useEffect(() => {
        if (!activeSession) return;
        appCore.contextManager.setFlag("tilmapSessionOpened", true, activeSession.id);
        return () => {
            appCore.contextManager.setFlag("tilmapSessionOpened", false, activeSession.id);
        }
    }, [activeSession])

    useEffect(() => {
        if (!activeWorkspace || !pixiApp) return;

        const toolManager = appCore.toolManager;
        const tilemapSessionManager = activeWorkspace.tilemapSessionManager;
        const currentSession = tilemapSessionManager.activeSession;

        if (currentSession) {
            const newView = new TilemapView(currentSession);
            viewRefMap.current.set(currentSession.id, newView);
            activateView(newView);
        }

        updateTilemapSessionList();

        return () => {
            viewRefMap.current.forEach((view) => {
                view.destroy();
            })
            viewRefMap.current.clear();

            activeViewRef.current?.view.session.off("onMarkChange", updateTilemapSessionList);
            activeViewRef.current = null;

            tilemapSessionManager.unregisterActiveView();
            toolManager.setActiveSession(null);
        }
    }, [activeWorkspace, pixiApp])

    useTilemapSessionEvent("onOpenTilemapSession", (session) => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        const pixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!activeWorkspace || !pixiApp) return;

        const activeView = activeViewRef.current;
        if (activeView && session.id === activeView.id) return;
        if (activeView) deactivateCurrentView();

        let newCurrentView = viewRefMap.current.get(session.id);
        if (!newCurrentView) {
            newCurrentView = new TilemapView(session);
            viewRefMap.current.set(session.id, newCurrentView);
        }

        activateView(newCurrentView);
    })

    useTilemapSessionEvent("onCreateTilemapSession", (session) => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        const pixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!activeWorkspace || !pixiApp) return;

        if (viewRefMap.current.has(session.id)) return;
        const newView = new TilemapView(session);
        viewRefMap.current.set(session.id, newView);

        updateTilemapSessionList();
    })

    useTilemapSessionEvent("onCloseTilemapSession", (sessionId) => {
        const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
        const pixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!activeWorkspace || !pixiApp) return;

        const activeView = activeViewRef.current;
        if (activeView && sessionId === activeView.id) deactivateCurrentView();

        const view = viewRefMap.current.get(sessionId);
        if (view) view.destroy();
        viewRefMap.current.delete(sessionId);

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