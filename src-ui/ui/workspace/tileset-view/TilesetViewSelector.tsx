import { TilesetView } from "@/graphics/view/tileset.view";
import PanelContainer from "@/ui/components/layout/PanelContainer";
import { useTilesetSessionEvent } from "@/ui/hooks/useTilesetSessionEvent.hook";
import { useTilesetPixiApp, useTilesetSessionActions } from "@/ui/stores/tileset-session.store";
import { useActiveWorkspace } from "@/ui/stores/workspace.store";
import { useCallback, useEffect, useRef } from "react";
import TilesetViewCanvas from "./TilesetViewCanvas";
import TilesetViewTabs from "./TilesetViewTabs";

export default function TilesetViewSelector() {
	const activeWorkspace = useActiveWorkspace();
	const pixiApp = useTilesetPixiApp();
	const { setTilesetSessions, setActiveSession } = useTilesetSessionActions();

	const activeViewRef = useRef<{ id: string, view: TilesetView } | null>(null);
	const viewRefMap = useRef<Map<string, TilesetView>>(new Map());

	const updateTilesetSessionList = useCallback(() => {
		if (!activeWorkspace) return;

		const tilesetSessionManager = activeWorkspace.tilesetSessionManager
		const sessionList = tilesetSessionManager.tilesetsSession.map(session => ({ name: session.tileset.name, sessionId: session.id }));
		setTilesetSessions(sessionList);
	}, [activeWorkspace, setTilesetSessions])

	const activateView = useCallback((view: TilesetView) => {
		if (!activeWorkspace || !pixiApp) return;

		const tilesetSessionManager = activeWorkspace.tilesetSessionManager;

		view.activateView(pixiApp);
		activeViewRef.current = { id: view.session.id, view: view };

		tilesetSessionManager.registerActiveView(view);

		setActiveSession(view.session);
	}, [activeWorkspace, pixiApp, setActiveSession])

	const deactivateCurrentView = useCallback(() => {
		const activeView = activeViewRef.current;

		if (!activeWorkspace || !activeView) return;

		activeView.view.unActivateView();
		activeViewRef.current = null;

		const tilesetSessionManager = activeWorkspace!.tilesetSessionManager;
		tilesetSessionManager.unregisterActiveView();

		setActiveSession(null);
	}, [activeWorkspace, setActiveSession])

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

			setActiveSession(null);
		}
	}, [activeWorkspace, activateView, pixiApp, setActiveSession, updateTilesetSessionList])

	useTilesetSessionEvent("onOpenTilesetSession", (session) => {
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
		if (!activeWorkspace || !pixiApp) return;

		if (viewRefMap.current.has(session.id)) return;
		const newView = new TilesetView(session);
		viewRefMap.current.set(session.id, newView);

		updateTilesetSessionList();
	})

	useTilesetSessionEvent("onCloseTilesetSession", (sessionId) => {
		if (!activeWorkspace || !pixiApp) return;

		const activeView = activeViewRef.current;
		if (activeView && sessionId === activeView.id) deactivateCurrentView();

		const view = viewRefMap.current.get(sessionId);
		if (view) view.destroy();
		viewRefMap.current.delete(sessionId);

		updateTilesetSessionList();
	})

	return (
		<PanelContainer className="tileset-selector">
			<TilesetViewCanvas />
			<TilesetViewTabs />
		</PanelContainer>
	);
}
