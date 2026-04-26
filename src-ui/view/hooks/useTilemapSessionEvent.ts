import { useEffect } from 'react';

import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { TilemapSessionManagerEvent } from '@/core/manager/tilemapSessionManager';
import { useTilemapEditorSessionStore } from '../stores/tilemapEditorSessionStore';

export function useTilemapSessionEvent<TEvent extends keyof TilemapSessionManagerEvent>(eventName: TEvent, callback: TilemapSessionManagerEvent[TEvent]) {
    const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
    const pixiApp = useTilemapEditorSessionStore((state) => state.pixiApp);

    useEffect(() => {
        if (!activeWorkspace || !pixiApp) return;
        const sessionManager = activeWorkspace.tilemapSessionManager;
        sessionManager.on(eventName, callback as any);
        return () => {
            sessionManager.off(eventName, callback as any);
        };
    }, [activeWorkspace, pixiApp, eventName, callback]);
}