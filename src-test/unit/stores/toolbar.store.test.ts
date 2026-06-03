import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useToolbarStore } from "@/ui/stores/toolbar.store";

describe("useToolbarStore", () => {
    beforeEach(() => {
        resetStore(useToolbarStore);
    });

    it("initializes with no tools and no active tool", () => {
        expect(useToolbarStore.getState()).toMatchObject({
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

        useToolbarStore.getState().setGroups(groups);

        expect(useToolbarStore.getState().groups).toBe(groups);
    });

    it("sets the active family", () => {
        useToolbarStore.getState().setActiveFamilyId("brush");
        expect(useToolbarStore.getState().activeFamilyId).toBe("brush");

        useToolbarStore.getState().setActiveFamilyId(null);
        expect(useToolbarStore.getState().activeFamilyId).toBeNull();
    });

    it("sets available families", () => {
        useToolbarStore.getState().setAvailableFamilyIds(["brush"]);
        expect(useToolbarStore.getState().availableFamilyIds).toEqual(["brush"]);
    });
});
