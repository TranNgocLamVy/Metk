
import { appKernel } from "@/application/bootstrap/app-kernel";
import { TilemapView } from "@/graphics/view/tilemap.view";
import { VStack } from "@/ui/components/custom/stack/Stack";
import PanelContainer from "@/ui/components/layout/PanelContainer";
import { useTilemapSessionEvent } from "@/ui/hooks/useTilemapSessionEvent.hook";
import { useActiveTilemapSession, useTilemapPixiApp, useTilemapSessionActions } from "@/ui/stores/tilemap-session.store";
import { useActiveWorkspace } from "@/ui/stores/workspace.store";
import { useCallback, useEffect, useRef } from "react";
import ToolBar from "../ToolBar";
import TilemapEditorCanvas from "./TilemapEditorCanvas";
import TilemapEditorTabs from "./TilemapEditorTabs";

export default function TilemapEditor() {
    const activeWorkspace = useActiveWorkspace();
    const pixiApp = useTilemapPixiApp();
    const activeSession = useActiveTilemapSession();
    const { setTilemapSessions, setActiveSession } = useTilemapSessionActions();

    const activeViewRef = useRef<{ id: string, view: TilemapView } | null>(null);
    const viewRefMap = useRef<Map<string, TilemapView>>(new Map());

    const updateTilemapSessionList = useCallback(() => {
        if (!activeWorkspace) return;

        const tilemapSessionManager = activeWorkspace.tilemapSessionManager
        const sessionList = tilemapSessionManager.tilemapsSession.map(session => ({ name: session.tilemap.name, sessionId: session.id, isDirty: session.isDirty }));
        setTilemapSessions(sessionList);
    }, [activeWorkspace, setTilemapSessions])

    const activateView = useCallback((view: TilemapView) => {
        if (!activeWorkspace || !pixiApp) return;

        const toolManager = appKernel.toolManager;
        const tilemapSessionManager = activeWorkspace.tilemapSessionManager;

        view.activateView(pixiApp);
        activeViewRef.current = { id: view.session.id, view: view };

        tilemapSessionManager.registerActiveView(view);
        toolManager.setActiveView(view);

        view.session.on("onMarkChange", updateTilemapSessionList);

        setActiveSession(view.session);
    }, [activeWorkspace, pixiApp, setActiveSession, updateTilemapSessionList])

    const deactivateCurrentView = useCallback(() => {
        const activeView = activeViewRef.current;

        if (!activeWorkspace || !activeView) return;

        activeView.view.unActivateView();
        activeViewRef.current = null;

        const toolManager = appKernel.toolManager;
        toolManager.setActiveView(null);

        const tilemapSessionManager = activeWorkspace!.tilemapSessionManager;
        tilemapSessionManager.unregisterActiveView();

        activeView.view.session.off("onMarkChange", updateTilemapSessionList);

        setActiveSession(null);
    }, [activeWorkspace, setActiveSession, updateTilemapSessionList])

    useEffect(() => {
        if (!activeSession) return;
        appKernel.activationContext.setFlag("tilmapSessionOpened", true, activeSession.id);
        return () => {
            appKernel.activationContext.setFlag("tilmapSessionOpened", false, activeSession.id);
        }
    }, [activeSession])

    useEffect(() => {
        if (!activeWorkspace || !pixiApp) return;

        const toolManager = appKernel.toolManager;
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
            toolManager.setActiveView(null);
            setActiveSession(null);
        }
    }, [activeWorkspace, activateView, pixiApp, setActiveSession, updateTilemapSessionList])

    useTilemapSessionEvent("onOpenTilemapSession", (session) => {
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
        if (!activeWorkspace || !pixiApp) return;

        if (viewRefMap.current.has(session.id)) return;
        const newView = new TilemapView(session);
        viewRefMap.current.set(session.id, newView);

        updateTilemapSessionList();
    })

    useTilemapSessionEvent("onCloseTilemapSession", (sessionId) => {
        if (!activeWorkspace || !pixiApp) return;

        const activeView = activeViewRef.current;
        if (activeView && sessionId === activeView.id) deactivateCurrentView();

        const view = viewRefMap.current.get(sessionId);
        if (view) view.destroy();
        viewRefMap.current.delete(sessionId);

        updateTilemapSessionList();
    })

    return (
        <PanelContainer className="tilemap-editor">
            <VStack className="w-full h-full px-frame-quarter pb-frame-quarter">
                <TilemapEditorTabs />
                <ToolBar />
                <TilemapEditorCanvas />
            </VStack>
        </PanelContainer>
    );
}
