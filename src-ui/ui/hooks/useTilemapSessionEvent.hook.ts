import { useEffect } from 'react';

import { useWorkspaceStore } from '../stores/workspace.store';
import { TilemapSessionManagerEvent } from '@/application/workspace/session/tilemap-session.manager';
import { useTilemapSessionStore } from '../stores/tilemap-session.store';

export function useTilemapSessionEvent<TEvent extends keyof TilemapSessionManagerEvent>(eventName: TEvent, callback: TilemapSessionManagerEvent[TEvent]) {
    const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
    const pixiApp = useTilemapSessionStore((state) => state.pixiApp);

    useEffect(() => {
        if (!activeWorkspace || !pixiApp) return;
        const sessionManager = activeWorkspace.tilemapSessionManager;
        sessionManager.on(eventName, callback as any);
        return () => {
            sessionManager.off(eventName, callback as any);
        };
    }, [activeWorkspace, pixiApp, eventName, callback]);
}