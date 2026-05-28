import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useLayoutStore } from "@/ui/stores/layout.store";

describe("useLayoutStore", () => {
    beforeEach(() => {
        resetStore(useLayoutStore);
    });

    it("initializes with the default workspace layout model", () => {
        expect(useLayoutStore.getState().model).toEqual(expect.objectContaining({
            layout: expect.any(Object),
        }));
    });

    it("sets the layout model", () => {
        const model = { id: "layout-model" } as any;

        useLayoutStore.getState().setModel(model);
        expect(useLayoutStore.getState().model).toBe(model);
    });
});
