import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useAppcore } from "@/ui/stores/appcore.store";

describe("useAppcore", () => {
    beforeEach(() => {
        resetStore(useAppcore);
    });

    it("initializes with the app core unloaded", () => {
        expect(useAppcore.getState().isAppcoreLoaded).toBe(false);
    });

    it("sets the app core loaded state", () => {
        useAppcore.getState().setIsAppcoreLoaded(true);
        expect(useAppcore.getState().isAppcoreLoaded).toBe(true);

        useAppcore.getState().setIsAppcoreLoaded(false);
        expect(useAppcore.getState().isAppcoreLoaded).toBe(false);
    });
});
