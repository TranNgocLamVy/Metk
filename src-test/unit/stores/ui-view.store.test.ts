import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useUIViewOptions } from "@/ui/stores/ui-view.store";

describe("useUIViewOptions", () => {
    beforeEach(() => {
        resetStore(useUIViewOptions);
    });

    it("initializes with all optional UI panels hidden", () => {
        expect(useUIViewOptions.getState()).toMatchObject({
            showProject: false,
            showConsole: false,
            showIssues: false,
            showProperties: false,
            showLayers: false,
            showHistory: false,
            showObjects: false,
            showTemplateEditor: false,
            showTilesets: false,
            showTerrainSets: false,
            showMinimap: false,
            showTileStamps: false,
            showMainToolbar: false,
            showTools: false,
            showToolOptions: false,
        });
    });

    it.each([
        ["toggleShowProject", "showProject"],
        ["toggleShowConsole", "showConsole"],
        ["toggleShowIssues", "showIssues"],
        ["toggleShowProperties", "showProperties"],
        ["toggleShowLayers", "showLayers"],
        ["toggleShowHistory", "showHistory"],
        ["toggleShowObjects", "showObjects"],
        ["toggleShowTemplateEditor", "showTemplateEditor"],
        ["toggleShowTilesets", "showTilesets"],
        ["toggleShowTerrainSets", "showTerrainSets"],
        ["toggleShowMinimap", "showMinimap"],
        ["toggleShowTileStamps", "showTileStamps"],
        ["toggleShowMainToolbar", "showMainToolbar"],
        ["toggleShowTools", "showTools"],
        ["toggleShowToolOptions", "showToolOptions"],
    ] as const)("%s toggles %s", (actionName, stateKey) => {
        expect(useUIViewOptions.getState()[stateKey]).toBe(false);

        useUIViewOptions.getState()[actionName]();
        expect(useUIViewOptions.getState()[stateKey]).toBe(true);

        useUIViewOptions.getState()[actionName]();
        expect(useUIViewOptions.getState()[stateKey]).toBe(false);
    });
});
