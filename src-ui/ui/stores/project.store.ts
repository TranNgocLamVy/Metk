import { create } from 'zustand';
import { appKernel } from '@/application/bootstrap/app-kernel';
import { ProjectMetadata } from '@/shared/data-types/project.data';
import { Project } from '@/editor/model/project/project';

interface ProjectState {
    projects: ProjectMetadata[];
    activeProject: Project | null;
}

type ProjectActions = {
    setProjects: (projects: ProjectMetadata[]) => void;
    setActiveProject: (project: Project | null) => void;
}

type ProjectStore = ProjectState & {
    actions: ProjectActions;
}

const useProjectStore = create<ProjectStore>((set) => {
    const project = appKernel.projectManager.currentProject;
    if (project) appKernel.activationContext.setFlag("projectOpened", true, project.id);

    const projectMetadatas = appKernel.projectManager.serialize();
    return {
        projects: projectMetadatas,
        activeProject: project,
        actions: {
            setProjects: (projects) => set({ projects }),
            setActiveProject: (project) => set({ activeProject: project }),
        },
    }
});

appKernel.projectManager.on("onProjectLoaded", (project) => {
    appKernel.activationContext.setFlag("projectOpened", true, project.id);
    useProjectStore.getState().actions.setActiveProject(project);
});

appKernel.projectManager.on("onProjectUnloaded", (projectId) => {
    appKernel.activationContext.setFlag("projectOpened", false, projectId);
    useProjectStore.getState().actions.setActiveProject(null);
});

appKernel.projectManager.on("onProjectMetadatasChanged", (projectMetadatas) => {
    useProjectStore.getState().actions.setProjects(projectMetadatas);
});

export const useProjects = () => useProjectStore((state) => state.projects);
export const useActiveProject = () => useProjectStore((state) => state.activeProject);
export const useProjectActions = () => useProjectStore((state) => state.actions);

export const getProjectStoreState = () => useProjectStore.getState();
export const resetProjectStoreForTest = () => useProjectStore.setState(useProjectStore.getInitialState(), true);
export const setProjectStoreStateForTest = (state: Partial<ProjectState>) => useProjectStore.setState(state);
