import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getLayerManagerStoreState, resetLayerManagerStoreForTest, setLayerManagerStoreStateForTest } from "@/ui/stores/layer-manager.store";

describe("useLayerManagerStore", () => {
    beforeEach(() => {
        resetLayerManagerStoreForTest();
    });

    it("initializes with no editing, selected, visible, or target parent layers", () => {
        expect(getLayerManagerStoreState()).toMatchObject({
            editingId: null,
            layerViews: [],
            selectedLayers: [],
            targetParentLayer: null,
        });
    });

    it("sets the editing layer id", () => {
        getLayerManagerStoreState().actions.setEditingId("layer-1");
        expect(getLayerManagerStoreState().editingId).toBe("layer-1");

        getLayerManagerStoreState().actions.setEditingId(null);
        expect(getLayerManagerStoreState().editingId).toBeNull();
    });

    it("sets layer views", () => {
        const layerViews = [{ id: "layer-1", layer: { id: "layer-1" }, depth: 2 }] as any;

        getLayerManagerStoreState().actions.setLayerViews(layerViews);

        expect(getLayerManagerStoreState().layerViews).toBe(layerViews);
    });

    it("sets selected layer ids", () => {
        getLayerManagerStoreState().actions.setSelectedLayer(["layer-1", "layer-2"]);

        expect(getLayerManagerStoreState().selectedLayers).toEqual(["layer-1", "layer-2"]);
    });

    it("sets the target parent layer", () => {
        const parentLayer = { id: "parent" } as any;

        getLayerManagerStoreState().actions.setTargetParentLayer(parentLayer);
        expect(getLayerManagerStoreState().targetParentLayer).toBe(parentLayer);

        getLayerManagerStoreState().actions.setTargetParentLayer(null);
        expect(getLayerManagerStoreState().targetParentLayer).toBeNull();
    });
});
