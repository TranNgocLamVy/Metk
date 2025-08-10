import { create } from "zustand";

import { ProjectFileData } from "@/appcore/models/Project/Project";

interface ProjectStore {
    projects: ProjectFileData[];
    currentProject: ProjectFileData | null;
    currentProjectName: string;

    setProjects: (projects: ProjectFileData[]) => void;
    addProject: (project: ProjectFileData) => void;
    removeProject: (project: ProjectFileData) => void;
    setCurrentProject: (project: ProjectFileData) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    currentProject: null,
    currentProjectName: "",

    setProjects: (projects) => {
        set({ projects });
    },
    addProject: (project) => {
        set((state) => ({
            projects: [...state.projects, project],
            currentProject: project,
        }));
    },
    removeProject: (project) => {
        set((state) => ({
            projects: state.projects.filter((p) => p.id !== project.id),
            currentProject: state.currentProject === project ? null : state.currentProject,
        }));
    },
    setCurrentProject: (project) => {
        set((state) => ({
            currentProject: project,
            currentProjectName: project.name,
        }));
    },
}));