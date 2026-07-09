import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getAppcoreStoreState, resetAppcoreStoreForTest, setAppcoreStoreStateForTest } from "@/ui/stores/appcore.store";

describe("useAppcore", () => {
    beforeEach(() => {
        resetAppcoreStoreForTest();
    });

    it("initializes with the app core unloaded", () => {
        expect(getAppcoreStoreState().isAppcoreLoaded).toBe(false);
    });

    it("sets the app core loaded state", () => {
        getAppcoreStoreState().actions.setIsAppcoreLoaded(true);
        expect(getAppcoreStoreState().isAppcoreLoaded).toBe(true);

        getAppcoreStoreState().actions.setIsAppcoreLoaded(false);
        expect(getAppcoreStoreState().isAppcoreLoaded).toBe(false);
    });
});
