import { create } from 'zustand';
import { appKernel } from '@/application/bootstrap/app-kernel';
import { ProjectMetadata } from '@/shared/schema/project.schema';
import { Project } from '@/editor/model/project/project';

interface ProjectState {
    projects: ProjectMetadata[];
    activeProject: Project | null;
    setProjects: (projects: ProjectMetadata[]) => void;
    setActiveProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => {
    const project = appKernel.projectManager.currentProject;
    if (project) appKernel.contextManager.setFlag("projectOpened", true, project.id);

    const projectMetadatas = appKernel.projectManager.serialize();
    return {
        projects: projectMetadatas,
        activeProject: project,
        setProjects: (projects) => set({ projects }),
        setActiveProject: (project) => set({ activeProject: project }),
    }
});

appKernel.projectManager.on("onProjectLoaded", (project) => {
    appKernel.contextManager.setFlag("projectOpened", true, project.id);
    useProjectStore.getState().setActiveProject(project);
});

appKernel.projectManager.on("onProjectUnloaded", (projectId) => {
    appKernel.contextManager.setFlag("projectOpened", false, projectId);
    useProjectStore.getState().setActiveProject(null);
});

appKernel.projectManager.on("onProjectMetadatasChanged", (projectMetadatas) => {
    useProjectStore.getState().setProjects(projectMetadatas);
});