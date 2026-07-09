import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getWorkspaceStoreState, resetWorkspaceStoreForTest, setWorkspaceStoreStateForTest } from "@/ui/stores/workspace.store";

describe("useWorkspaceStore", () => {
    beforeEach(() => {
        resetWorkspaceStoreForTest();
    });

    it("initializes without an active workspace", () => {
        expect(getWorkspaceStoreState().activeWorkspace).toBeNull();
    });

    it("sets the active workspace", () => {
        const workspace = { id: "workspace-1" } as any;

        getWorkspaceStoreState().actions.setActiveWorkspace(workspace);
        expect(getWorkspaceStoreState().activeWorkspace).toBe(workspace);

        getWorkspaceStoreState().actions.setActiveWorkspace(null);
        expect(getWorkspaceStoreState().activeWorkspace).toBeNull();
    });
});
