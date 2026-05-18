import { useEffect } from 'react';

import { useWorkspaceStore } from '../stores/workspace.store';
import { TilesetSessionManagerEvent } from '@/application/workspace/session/tileset-session.manager';
import { useTilesetSessionStore } from '../stores/tileset-session.store';

export function useTilesetSessionEvent<TEvent extends keyof TilesetSessionManagerEvent>(eventName: TEvent, callback: TilesetSessionManagerEvent[TEvent]) {
    const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
    const pixiApp = useTilesetSessionStore((state) => state.pixiApp);

    useEffect(() => {
        if (!activeWorkspace || !pixiApp) return;
        const sessionManager = activeWorkspace.tilesetSessionManager;
        sessionManager.on(eventName, callback as any);
        return () => {
            sessionManager.off(eventName, callback as any);
        };
    }, [activeWorkspace, pixiApp, eventName, callback]);
}