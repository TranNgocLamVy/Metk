import { create } from "zustand";

import { AppCore } from "@/core/appcore";
import { ProjectMetaData } from "@/shared/schema/projectSchema";

type ProjectManagerState = {
    version: number;
    projects: ProjectMetaData[];
    getProjects(): ProjectMetaData[];
    refresh: () => void
}

export const useProjectManagerStore = create<ProjectManagerState>((set, get) => {
    return {
        version: 0,
        projects: [],
        currentProject: null,
        getProjects: () => {
            return AppCore.getIns().projectManager.projectMetaData;
        },
        refresh: () => { set({ version: (get().version + 1) % 100000 }) }
    }
})