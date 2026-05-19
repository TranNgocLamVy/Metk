import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useProjectStore } from "@/ui/stores/project.store";

describe("useProjectStore", () => {
    beforeEach(() => {
        resetStore(useProjectStore);
    });

    it("initializes with serialized projects and no active project", () => {
        expect(useProjectStore.getState()).toMatchObject({
            projects: [],
            activeProject: null,
        });
    });

    it("sets project metadata entries", () => {
        const projects = [{ id: "project-1", name: "Project One" }] as any;

        useProjectStore.getState().setProjects(projects);

        expect(useProjectStore.getState().projects).toBe(projects);
    });

    it("sets the active project", () => {
        const project = { id: "project-1" } as any;

        useProjectStore.getState().setActiveProject(project);
        expect(useProjectStore.getState().activeProject).toBe(project);

        useProjectStore.getState().setActiveProject(null);
        expect(useProjectStore.getState().activeProject).toBeNull();
    });
});
