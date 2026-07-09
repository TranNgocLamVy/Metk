import { beforeEach, describe, expect, it } from "vitest";

import { getLayoutStoreState, resetLayoutStoreForTest } from "@/ui/stores/layout.store";

describe("useLayoutStore", () => {
    beforeEach(() => {
        resetLayoutStoreForTest();
    });

    it("initializes with the default workspace layout model", () => {
        expect(getLayoutStoreState().model.toJson()).toEqual(expect.objectContaining({
            layout: expect.any(Object),
        }));
    });

    it("sets the layout model", () => {
        const model = { id: "layout-model" } as any;

        getLayoutStoreState().actions.setModel(model);
        expect(getLayoutStoreState().model).toBe(model);
    });
});
