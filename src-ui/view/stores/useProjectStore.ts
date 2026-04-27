import { create } from 'zustand';
import { appCore } from '@/core/appcore';
import { Project } from '@/core/application/project';

interface ProjectState {
    activeProject: Project | null;
    setActiveProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => {
    return {
        activeProject: null,
        setActiveProject: (project) => set({ activeProject: project }),
    }
});

appCore.projectManager.on("onProjectLoaded", (project) => {
    appCore.contextManager.setFlag("projectOpened", true, project.id);
    useProjectStore.getState().setActiveProject(project);
});

appCore.projectManager.on("onProjectUnloaded", (projectId) => {
    appCore.contextManager.setFlag("projectOpened", false, projectId);
    useProjectStore.getState().setActiveProject(null);
});