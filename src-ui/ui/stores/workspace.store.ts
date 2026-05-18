import { create } from 'zustand';
import { appKernel } from '@/application/bootstrap/app-kernel';
import { Workspace } from '@/editor/model/workspace/workspace';

interface WorkspaceState {
    activeWorkspace: Workspace | null;
    setActiveWorkspace: (workspace: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => {
    const workspace = appKernel.workspaceManager.currentWorkspace;
    return {
        activeWorkspace: workspace,
        setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
    }
});

appKernel.workspaceManager.on("onWorkspaceLoaded", (workspace) => {
    useWorkspaceStore.getState().setActiveWorkspace(workspace);
});

appKernel.workspaceManager.on("onWorkspaceUnloaded", () => {
    useWorkspaceStore.getState().setActiveWorkspace(null);
});