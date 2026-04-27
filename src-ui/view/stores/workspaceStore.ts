import { create } from 'zustand';
import { appCore } from '@/core/appcore';
import { Workspace } from '@/core/application/workspace';

interface WorkspaceState {
    activeWorkspace: Workspace | null;
    setActiveWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => {
    const workspace = appCore.workspaceManager.currentWorkspace;
    return {
        activeWorkspace: workspace,
        setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
    }
});

appCore.workspaceManager.on("onWorkspaceLoaded", (workspace) => {
    useWorkspaceStore.getState().setActiveWorkspace(workspace);
});

appCore.workspaceManager.on("onWorkspaceUnloaded", () => {
    useWorkspaceStore.getState().setActiveWorkspace(null);
});