import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetStore } from "./store-test-utils";
import { getNavigationStoreState, resetNavigationStoreForTest, setNavigationStoreStateForTest } from "@/ui/stores/navigation.store";

describe("useNavigationStore", () => {
    beforeEach(() => {
        resetNavigationStoreForTest();
    });

    it("initializes without a navigate function", () => {
        expect(getNavigationStoreState().navigate).toBeNull();
    });

    it("sets the navigate function", () => {
        const navigate = vi.fn();

        getNavigationStoreState().actions.setNavigate(navigate);
        getNavigationStoreState().navigate?.("/projects");

        expect(getNavigationStoreState().navigate).toBe(navigate);
        expect(navigate).toHaveBeenCalledWith("/projects");
    });
});
