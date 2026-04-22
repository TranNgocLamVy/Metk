import { create } from "zustand";

import { appCore } from "@/core/appcore";
import { ProjectMetadata } from "@/shared/schema/projectSchema";

type ProjectManagerState = {
    version: number;
    projects: ProjectMetadata[];
    getProjects(): ProjectMetadata[];
    refresh: () => void
}

export const useProjectManagerStore = create<ProjectManagerState>((set, get) => {
    return {
        version: 0,
        projects: [],
        currentProject: null,
        getProjects: () => {
            return appCore.projectManager.serialize();
        },
        refresh: () => { set({ version: (get().version + 1) % 100000 }) }
    }
})