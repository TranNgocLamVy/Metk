import { create } from 'zustand';
import { appKernel } from '@/application/bootstrap/app-kernel';
import { Workspace } from '@/editor/model/workspace/workspace';

interface WorkspaceState {
    activeWorkspace: Workspace | null;
}

type WorkspaceActions = {
    setActiveWorkspace: (workspace: Workspace | null) => void;
}

type WorkspaceStore = WorkspaceState & {
    actions: WorkspaceActions;
}

const useWorkspaceStore = create<WorkspaceStore>((set) => {
    const workspace = appKernel.workspaceManager.currentWorkspace;
    return {
        activeWorkspace: workspace,
        actions: {
            setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
        },
    }
});

appKernel.workspaceManager.on("onWorkspaceLoaded", (workspace) => {
    useWorkspaceStore.getState().actions.setActiveWorkspace(workspace);
});

appKernel.workspaceManager.on("onWorkspaceUnloaded", () => {
    useWorkspaceStore.getState().actions.setActiveWorkspace(null);
});

export const useActiveWorkspace = () => useWorkspaceStore((state) => state.activeWorkspace);
export const useWorkspaceActions = () => useWorkspaceStore((state) => state.actions);

export const getWorkspaceStoreState = () => useWorkspaceStore.getState();
export const resetWorkspaceStoreForTest = () => useWorkspaceStore.setState(useWorkspaceStore.getInitialState(), true);
export const setWorkspaceStoreStateForTest = (state: Partial<WorkspaceState>) => useWorkspaceStore.setState(state);
