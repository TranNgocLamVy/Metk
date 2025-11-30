import { create } from "zustand";

import { Project } from "@/core/models/project";

type ProjectManagerState = {
    projects: Project[];
    addProject: (project: Project) => void;
}

export const useProjectManagerStore = create<ProjectManagerState>((set, get) => {
    return {
        projects: [],
        addProject: (project: Project) => {
            set((state) => {
                const projects = [...state.projects, project];
                return { projects };
            })
        },
    }
})