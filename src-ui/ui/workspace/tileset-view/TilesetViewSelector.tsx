import { TilesetView } from "@/graphics/view/tileset.view";
import { VStack } from "@/ui/components/custom/stack/Stack";
import { useTilesetSessionEvent } from "@/ui/hooks/useTilesetSessionEvent.hook";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";
import { useCallback, useEffect, useRef } from "react";
import TilesetViewCanvas from "./TilesetViewCanvas";
import TilesetViewTabs from "./TilesetViewTabs";

export default function TilesetViewSelector() {
	const { activeWorkspace } = useWorkspaceStore();
	const { pixiApp, setTilesetSessions } = useTilesetSessionStore();

	const activeViewRef = useRef<{ id: string, view: TilesetView } | null>(null);
	const viewRefMap = useRef<Map<string, TilesetView>>(new Map());

	const updateTilesetSessionList = useCallback(() => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		if (!activeWorkspace) return;

		const tilesetSessionManager = activeWorkspace.tilesetSessionManager
		const sessionList = tilesetSessionManager.tilesetsSession.map(session => ({ name: session.tileset.name, sessionId: session.id }));
		setTilesetSessions(sessionList);
	}, [])

	const activateView = useCallback((view: TilesetView) => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		const pixiApp = useTilesetSessionStore.getState().pixiApp;
		if (!activeWorkspace || !pixiApp) return;

		const tilesetSessionManager = activeWorkspace.tilesetSessionManager;

		view.activateView(pixiApp);
		activeViewRef.current = { id: view.session.id, view: view };

		tilesetSessionManager.registerActiveView(view);

		useTilesetSessionStore.getState().setActiveSession(view.session);
	}, [])

	const deactivateCurrentView = useCallback(() => {
		const activeView = activeViewRef.current;
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;

		if (!activeWorkspace || !activeView) return;

		activeView.view.unActivateView();
		activeViewRef.current = null;

		const tilesetSessionManager = activeWorkspace!.tilesetSessionManager;
		tilesetSessionManager.unregisterActiveView();

		useTilesetSessionStore.getState().setActiveSession(null);
	}, [])

	useEffect(() => {
		if (!activeWorkspace || !pixiApp) return;

		const tilesetSessionManager = activeWorkspace.tilesetSessionManager;
		const currentSession = tilesetSessionManager.activeSession;

		if (currentSession) {
			const newView = new TilesetView(currentSession);
			viewRefMap.current.set(currentSession.id, newView);
			activateView(newView);
		}

		updateTilesetSessionList();

		return () => {
			viewRefMap.current.forEach((view) => {
				view.destroy();
			})
			viewRefMap.current.clear();

			activeViewRef.current = null;

			tilesetSessionManager.unregisterActiveView();

			useTilesetSessionStore.getState().setActiveSession(null);
		}
	}, [activeWorkspace, pixiApp])

	useTilesetSessionEvent("onOpenTilesetSession", (session) => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		const pixiApp = useTilesetSessionStore.getState().pixiApp;
		if (!activeWorkspace || !pixiApp) return;

		const activeView = activeViewRef.current;
		if (activeView && session.id === activeView.id) return;
		if (activeView) deactivateCurrentView();

		let newCurrentView = viewRefMap.current.get(session.id);
		if (!newCurrentView) {
			newCurrentView = new TilesetView(session);
			viewRefMap.current.set(session.id, newCurrentView);
		}

		updateTilesetSessionList();
		activateView(newCurrentView);
	})

	useTilesetSessionEvent("onCreateTilesetSession", (session) => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		const pixiApp = useTilesetSessionStore.getState().pixiApp;
		if (!activeWorkspace || !pixiApp) return;

		if (viewRefMap.current.has(session.id)) return;
		const newView = new TilesetView(session);
		viewRefMap.current.set(session.id, newView);

		updateTilesetSessionList();
	})

	useTilesetSessionEvent("onCloseTilesetSession", (sessionId) => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		const pixiApp = useTilesetSessionStore.getState().pixiApp;
		if (!activeWorkspace || !pixiApp) return;

		const activeView = activeViewRef.current;
		if (activeView && sessionId === activeView.id) deactivateCurrentView();

		const view = viewRefMap.current.get(sessionId);
		if (view) view.destroy();
		viewRefMap.current.delete(sessionId);

		updateTilesetSessionList();
	})

	return (
		<VStack className="tilesetView h-full bg-surface relative">
			<div className="flex absolute top-0 left-0 right-0 bottom-0 pointer-events-none pb-frame-half px-frame-quarter">
				<div className="w-full h-full border border-t-0 border-foreground/30 z-10"/>
			</div>
			<TilesetViewCanvas />
			<TilesetViewTabs />
		</VStack>
	);
}
