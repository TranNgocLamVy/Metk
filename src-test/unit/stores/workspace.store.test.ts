import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";

describe("useWorkspaceStore", () => {
    beforeEach(() => {
        resetStore(useWorkspaceStore);
    });

    it("initializes without an active workspace", () => {
        expect(useWorkspaceStore.getState().activeWorkspace).toBeNull();
    });

    it("sets the active workspace", () => {
        const workspace = { id: "workspace-1" } as any;

        useWorkspaceStore.getState().setActiveWorkspace(workspace);
        expect(useWorkspaceStore.getState().activeWorkspace).toBe(workspace);

        useWorkspaceStore.getState().setActiveWorkspace(null);
        expect(useWorkspaceStore.getState().activeWorkspace).toBeNull();
    });
});
