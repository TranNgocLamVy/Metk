import { create } from "zustand";

import { Project } from "@/core/application/project";
import { ProjectMetaData } from "@/shared/schema/projectSchema";

type ProjectManagerState = {
    projects: ProjectMetaData[];
    currentProject: Project | null;
    setProjects: (projects: ProjectMetaData[]) => void;
    addProject: (project: ProjectMetaData) => void;
    setCurrentProject: (project: Project) => void;
}

export const useProjectManagerStore = create<ProjectManagerState>((set, get) => {
    return {
        projects: [],
        currentProject: null,
        setProjects: (projects: ProjectMetaData[]) => set({ projects }),
        addProject: (project: ProjectMetaData) => {
            set((state) => {
                return { projects: [...state.projects, project] };
            })
        },
        setCurrentProject: (project: Project) => {
            set({ currentProject: project });
        }
    }
})