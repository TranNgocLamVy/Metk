import { create } from "zustand";

import { Project } from "@/appcore/models/project/Project";
import { ProjectMetaData } from "@/appcore/schemas/projectSchema";

interface ProjectStore {
    currentProject: ProjectMetaData | null;
    projects: ProjectMetaData[];

    setProjects: (projects: ProjectMetaData[]) => void;
    addProject: (project: ProjectMetaData) => void;
    removeProject: (id: string) => void;
    setCurrentProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    currentProject: null,
    currentProjectName: "",

    setProjects: (projects) => {
        set({ projects: [...projects] });
    },
    addProject: (project) => {
        set((state) => ({
            projects: [...state.projects, project],
        }));
    },
    removeProject: (id) => {
        set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
        }));
    },
    setCurrentProject: (id) => {
        set((state) => ({
            currentProject: state.projects.find((p) => p.id === id),
        }));
    },
}));