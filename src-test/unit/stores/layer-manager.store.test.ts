import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useLayerManagerStore } from "@/ui/stores/layer-manager.store";

describe("useLayerManagerStore", () => {
    beforeEach(() => {
        resetStore(useLayerManagerStore);
    });

    it("initializes with no editing, selected, visible, or target parent layers", () => {
        expect(useLayerManagerStore.getState()).toMatchObject({
            editingId: null,
            layerViews: [],
            selectedLayers: [],
            targetParentLayer: null,
        });
    });

    it("sets the editing layer id", () => {
        useLayerManagerStore.getState().setEditingId("layer-1");
        expect(useLayerManagerStore.getState().editingId).toBe("layer-1");

        useLayerManagerStore.getState().setEditingId(null);
        expect(useLayerManagerStore.getState().editingId).toBeNull();
    });

    it("sets layer views", () => {
        const layerViews = [{ id: "layer-1", layer: { id: "layer-1" }, depth: 2 }] as any;

        useLayerManagerStore.getState().setLayerViews(layerViews);

        expect(useLayerManagerStore.getState().layerViews).toBe(layerViews);
    });

    it("sets selected layer ids", () => {
        useLayerManagerStore.getState().setSelectedLayer(["layer-1", "layer-2"]);

        expect(useLayerManagerStore.getState().selectedLayers).toEqual(["layer-1", "layer-2"]);
    });

    it("sets the target parent layer", () => {
        const parentLayer = { id: "parent" } as any;

        useLayerManagerStore.getState().setTargetParentLayer(parentLayer);
        expect(useLayerManagerStore.getState().targetParentLayer).toBe(parentLayer);

        useLayerManagerStore.getState().setTargetParentLayer(null);
        expect(useLayerManagerStore.getState().targetParentLayer).toBeNull();
    });
});
