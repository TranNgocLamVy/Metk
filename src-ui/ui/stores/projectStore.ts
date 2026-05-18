import { create } from 'zustand';
import { appCore } from '@/editor/appcore';
import { Project } from '@/editor/application/project';
import { ProjectMetadata } from '@/shared/schema/projectSchema';

interface ProjectState {
    projects: ProjectMetadata[];
    activeProject: Project | null;
    setProjects: (projects: ProjectMetadata[]) => void;
    setActiveProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => {
    const project = appCore.projectManager.currentProject;
    if (project) appCore.contextManager.setFlag("projectOpened", true, project.id);

    const projectMetadatas = appCore.projectManager.serialize();
    return {
        projects: projectMetadatas,
        activeProject: project,
        setProjects: (projects) => set({ projects }),
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

appCore.projectManager.on("onProjectMetadatasChanged", (projectMetadatas) => {
    useProjectStore.getState().setProjects(projectMetadatas);
});