import { create } from 'zustand';
import type { Workspace } from '../../core/application/workspace';
import { appCore } from '@/core/appcore';

interface WorkspaceState {
    activeWorkspace: Workspace | null;
    setActiveWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => {
    return {
        activeWorkspace: null,
        setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
    }
});

appCore.workspaceManager.on("onWorkspaceLoaded", (workspace) => {
    useWorkspaceStore.getState().setActiveWorkspace(workspace);
});

appCore.workspaceManager.on("onWorkspaceUnloaded", () => {
    useWorkspaceStore.getState().setActiveWorkspace(null);
});