import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetStore } from "./store-test-utils";
import { useNavigationStore } from "@/ui/stores/navigation.store";

describe("useNavigationStore", () => {
    beforeEach(() => {
        resetStore(useNavigationStore);
    });

    it("initializes without a navigate function", () => {
        expect(useNavigationStore.getState().navigate).toBeNull();
    });

    it("sets the navigate function", () => {
        const navigate = vi.fn();

        useNavigationStore.getState().setNavigate(navigate);
        useNavigationStore.getState().navigate?.("/projects");

        expect(useNavigationStore.getState().navigate).toBe(navigate);
        expect(navigate).toHaveBeenCalledWith("/projects");
    });
});
