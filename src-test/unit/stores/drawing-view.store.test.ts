import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useDrawingViewOptions } from "@/ui/stores/drawing-view.store";

describe("useDrawingViewOptions", () => {
    beforeEach(() => {
        resetStore(useDrawingViewOptions);
    });

    it("initializes with the default drawing view options", () => {
        expect(useDrawingViewOptions.getState()).toMatchObject({
            showGrid: true,
            showTileObjectOutlines: false,
            showObjectReferences: false,
            showObjectNames: "ForAllObjects",
            showNamesForHoveredObjects: false,
            showTileAnimations: false,
            showTileCollisionShapes: false,
            showWorld: false,
            enableParallax: false,
            highlightCurrentLayer: false,
            highlightHoveredObject: false,
            snappingMode: "None",
        });
    });

    it.each([
        ["toggleGrid", "showGrid", true, false],
        ["toggleTileObjectOutlines", "showTileObjectOutlines", false, true],
        ["toggleObjectReferences", "showObjectReferences", false, true],
        ["toggleNamesForHoveredObjects", "showNamesForHoveredObjects", false, true],
        ["toggleTileAnimations", "showTileAnimations", false, true],
        ["toggleTileCollisionShapes", "showTileCollisionShapes", false, true],
        ["toggleWorld", "showWorld", false, true],
        ["toggleParallax", "enableParallax", false, true],
        ["toggleHighlightCurrentLayer", "highlightCurrentLayer", false, true],
        ["toggleHighlightHoveredObject", "highlightHoveredObject", false, true],
    ] as const)("%s toggles %s", (actionName, stateKey, initialValue, nextValue) => {
        expect(useDrawingViewOptions.getState()[stateKey]).toBe(initialValue);

        useDrawingViewOptions.getState()[actionName]();

        expect(useDrawingViewOptions.getState()[stateKey]).toBe(nextValue);
    });

    it("sets the object name visibility mode", () => {
        useDrawingViewOptions.getState().setShowObjectNames("ForSelectedObjects");

        expect(useDrawingViewOptions.getState().showObjectNames).toBe("ForSelectedObjects");
    });

    it("sets the snapping mode", () => {
        useDrawingViewOptions.getState().setSnappingMode("SnapToGrid");

        expect(useDrawingViewOptions.getState().snappingMode).toBe("SnapToGrid");
    });
});
