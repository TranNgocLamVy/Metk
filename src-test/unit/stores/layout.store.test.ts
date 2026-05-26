import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useLayoutStore } from "@/ui/stores/layout.store";

describe("useLayoutStore", () => {
    beforeEach(() => {
        resetStore(useLayoutStore);
    });

    it("initializes without a layout model", () => {
        expect(useLayoutStore.getState().model).toBeNull();
    });

    it("sets the layout model", () => {
        const model = { id: "layout-model" } as any;

        useLayoutStore.getState().setModel(model);
        expect(useLayoutStore.getState().model).toBe(model);
    });
});
