import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getToolbarStoreState, resetToolbarStoreForTest, setToolbarStoreStateForTest } from "@/ui/stores/toolbar.store";

describe("useToolbarStore", () => {
    beforeEach(() => {
        resetToolbarStoreForTest();
    });

    it("initializes with no tools and no active tool", () => {
        expect(getToolbarStoreState()).toMatchObject({
            groups: [],
            activeFamilyId: null,
            availableFamilyIds: [],
        });
    });

    it("sets toolbar groups", () => {
        const groups = [{
            id: "drawing",
            label: "Drawing",
            items: [{ id: "brush", icon: "Brush", tooltip: "Brush", index: 0, shortcuts: ["B"] }],
        }];

        getToolbarStoreState().actions.setGroups(groups);

        expect(getToolbarStoreState().groups).toBe(groups);
    });

    it("sets the active family", () => {
        getToolbarStoreState().actions.setActiveFamilyId("brush");
        expect(getToolbarStoreState().activeFamilyId).toBe("brush");

        getToolbarStoreState().actions.setActiveFamilyId(null);
        expect(getToolbarStoreState().activeFamilyId).toBeNull();
    });

    it("sets available families", () => {
        getToolbarStoreState().actions.setAvailableFamilyIds(["brush"]);
        expect(getToolbarStoreState().availableFamilyIds).toEqual(["brush"]);
    });
});
