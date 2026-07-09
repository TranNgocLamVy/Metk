import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getProjectStoreState, resetProjectStoreForTest, setProjectStoreStateForTest } from "@/ui/stores/project.store";

describe("useProjectStore", () => {
    beforeEach(() => {
        resetProjectStoreForTest();
    });

    it("initializes with serialized projects and no active project", () => {
        expect(getProjectStoreState()).toMatchObject({
            projects: [],
            activeProject: null,
        });
    });

    it("sets project metadata entries", () => {
        const projects = [{ id: "project-1", name: "Project One" }] as any;

        getProjectStoreState().actions.setProjects(projects);

        expect(getProjectStoreState().projects).toBe(projects);
    });

    it("sets the active project", () => {
        const project = { id: "project-1" } as any;

        getProjectStoreState().actions.setActiveProject(project);
        expect(getProjectStoreState().activeProject).toBe(project);

        getProjectStoreState().actions.setActiveProject(null);
        expect(getProjectStoreState().activeProject).toBeNull();
    });
});
