import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useToolbarStore } from "@/ui/stores/toolbar.store";

describe("useToolbarStore", () => {
    beforeEach(() => {
        resetStore(useToolbarStore);
    });

    it("initializes with no tools and no active tool", () => {
        expect(useToolbarStore.getState()).toMatchObject({
            tools: [],
            activeTool: null,
        });
    });

    it("sets toolbar tools", () => {
        const tools = [{ id: "brush", icon: "Brush", tooltip: "Brush", index: 0, shortcuts: ["B"] }];

        useToolbarStore.getState().setTools(tools);

        expect(useToolbarStore.getState().tools).toBe(tools);
    });

    it("sets the active tool", () => {
        useToolbarStore.getState().setActiveTool("brush");
        expect(useToolbarStore.getState().activeTool).toBe("brush");

        useToolbarStore.getState().setActiveTool(null);
        expect(useToolbarStore.getState().activeTool).toBeNull();
    });
});
