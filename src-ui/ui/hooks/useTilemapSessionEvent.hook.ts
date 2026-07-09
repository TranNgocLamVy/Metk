import { useEffect } from 'react';

import { useActiveWorkspace } from '../stores/workspace.store';
import { TilemapSessionManagerEvent } from '@/application/workspace/session/tilemap-session.manager';
import { useTilemapPixiApp } from '../stores/tilemap-session.store';

export function useTilemapSessionEvent<TEvent extends keyof TilemapSessionManagerEvent>(eventName: TEvent, callback: TilemapSessionManagerEvent[TEvent]) {
    const activeWorkspace = useActiveWorkspace();
    const pixiApp = useTilemapPixiApp();

    useEffect(() => {
        if (!activeWorkspace || !pixiApp) return;
        const sessionManager = activeWorkspace.tilemapSessionManager;
        sessionManager.on(eventName, callback as any);
        return () => {
            sessionManager.off(eventName, callback as any);
        };
    }, [activeWorkspace, pixiApp, eventName, callback]);
}
