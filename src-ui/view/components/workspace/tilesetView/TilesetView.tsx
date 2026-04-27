import { useWorkspaceStore } from "@/view/stores/useWorkspaceStore";
import { VStack } from "../../custom/stack/Stack";
import TilesetMenuBar from "./TilesetMenuBar";
import TilesetViewCanvas from "./TilesetViewCanvas";
import TilesetViewTabs from "./TilesetViewTabs";
import { useTilesetSessionStore } from "@/view/stores/tilesetSessionStore";
import { useCallback, useEffect, useRef } from "react";
import { TilesetSessionView } from "@/core/application/session/tilesetSessionView";
import { useTilesetSessionEvent } from "@/view/hooks/useTilesetSessionEvent";

export default function TilesetView() {
	const { activeWorkspace } = useWorkspaceStore();
	const { pixiApp, setTilesetSessions } = useTilesetSessionStore();

	const activeSessionViewRef = useRef<{ id: string, view: TilesetSessionView } | null>(null);
	const sessionViewRefMap = useRef<Map<string, TilesetSessionView>>(new Map());

	const updateTilesetSessionList = useCallback(() => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		if (!activeWorkspace) return;

		const tilesetSessionManager = activeWorkspace.tilesetSessionManager
		const sessionList = tilesetSessionManager.tilesetsSession.map(session => ({ name: session.tileset.name, sessionId: session.id }));
		setTilesetSessions(sessionList);
	}, [])

	const activateSessionView = useCallback((sessionView: TilesetSessionView) => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		const pixiApp = useTilesetSessionStore.getState().pixiApp;
		if (!activeWorkspace || !pixiApp) return;

		const tilesetSessionManager = activeWorkspace.tilesetSessionManager;

		sessionView.activateSession(pixiApp);
		activeSessionViewRef.current = { id: sessionView.session.id, view: sessionView };

		tilesetSessionManager.registerActiveSessionView(sessionView);

		useTilesetSessionStore.getState().setActiveSession(sessionView.session);
	}, [])

	const deactivateCurrentSessionView = useCallback(() => {
		const activeSessionView = activeSessionViewRef.current;
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;

		if (!activeWorkspace || !activeSessionView) return;

		activeSessionView.view.unActivateSession();
		activeSessionViewRef.current = null;

		const tilesetSessionManager = activeWorkspace!.tilesetSessionManager;
		tilesetSessionManager.unregisterActiveSessionView();

		useTilesetSessionStore.getState().setActiveSession(null);
	}, [])

	useEffect(() => {
		if (!activeWorkspace || !pixiApp) return;

		const tilesetSessionManager = activeWorkspace.tilesetSessionManager;
		const currentSession = tilesetSessionManager.activeSession;

		if (currentSession) {
			const newSessionView = new TilesetSessionView(currentSession);
			sessionViewRefMap.current.set(currentSession.id, newSessionView);
			activateSessionView(newSessionView);
		}

		updateTilesetSessionList();

		return () => {
			sessionViewRefMap.current.forEach((sessionView) => {
				sessionView.destroy();
			})
			sessionViewRefMap.current.clear();

			activeSessionViewRef.current = null;

			tilesetSessionManager.unregisterActiveSessionView();
		}
	}, [activeWorkspace, pixiApp])

	useTilesetSessionEvent("onOpenTilesetSession", (session) => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		const pixiApp = useTilesetSessionStore.getState().pixiApp;
		if (!activeWorkspace || !pixiApp) return;

		const activeSessionView = activeSessionViewRef.current;
		if (activeSessionView && session.id === activeSessionView.id) return;
		if (activeSessionView) deactivateCurrentSessionView();

		let newCurrentSessionView = sessionViewRefMap.current.get(session.id);
		if (!newCurrentSessionView) {
			newCurrentSessionView = new TilesetSessionView(session);
			sessionViewRefMap.current.set(session.id, newCurrentSessionView);
		}

		updateTilesetSessionList();
		activateSessionView(newCurrentSessionView);
	})

	useTilesetSessionEvent("onCreateTilesetSession", (session) => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		const pixiApp = useTilesetSessionStore.getState().pixiApp;
		if (!activeWorkspace || !pixiApp) return;

		if (sessionViewRefMap.current.has(session.id)) return;
		const newSessionView = new TilesetSessionView(session);
		sessionViewRefMap.current.set(session.id, newSessionView);

		updateTilesetSessionList();
	})

	useTilesetSessionEvent("onCloseTilesetSession", (sessionId) => {
		const activeWorkspace = useWorkspaceStore.getState().activeWorkspace;
		const pixiApp = useTilesetSessionStore.getState().pixiApp;
		if (!activeWorkspace || !pixiApp) return;

		const activeSessionView = activeSessionViewRef.current;
		if (activeSessionView && sessionId === activeSessionView.id) deactivateCurrentSessionView();

		const sessionView = sessionViewRefMap.current.get(sessionId);
		if (sessionView) sessionView.destroy();
		sessionViewRefMap.current.delete(sessionId);

		updateTilesetSessionList();
	})

	return (
		<VStack className="tilesetView h-full px-1 py-2 bg-surface relative">
			<TilesetViewTabs />
			<TilesetViewCanvas />
			<TilesetMenuBar />
		</VStack>
	);
}
