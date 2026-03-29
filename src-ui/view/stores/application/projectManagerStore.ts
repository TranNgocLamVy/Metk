import { create } from "zustand";

import { AppCore } from "@/core/appcore";
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
            return AppCore.getIns().projectManager.serialize();
        },
        refresh: () => { set({ version: (get().version + 1) % 100000 }) }
    }
})