import { describe, expect, it, vi } from "vitest";

import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { createReferenceContext } from "./editor-test-utils";

const createRootLayer = () => {
    const context = createReferenceContext();
    const rootLayer = new RootLayer(
        [
            {
                id: "group-1",
                type: "group",
                name: "Group One",
                opacity: 0.8,
                open: true,
                visible: true,
                locked: false,
                layers: [
                    {
                        id: "tile-1",
                        type: "tile",
                        name: "Ground",
                        x: 0,
                        y: 0,
                        width: 2,
                        height: 2,
                        opacity: 1,
                        visible: true,
                        locked: false,
                        offsetx: 0,
                        offsety: 0,
                        layerData: "0,0\n0,0",
                    },
                ],
            },
            {
                id: "tile-2",
                type: "tile",
                name: "Overlay",
                x: 0,
                y: 0,
                width: 2,
                height: 2,
                opacity: 1,
                visible: true,
                locked: false,
                offsetx: 0,
                offsety: 0,
                layerData: "0,0\n0,0",
            },
        ],
        context.tilesetRefManager,
        context.rulesetRefManager,
    );

    return { rootLayer, context };
};

describe("RootLayer", () => {
    it("builds a layer tree from nested data and traverses it in hierarchy order", () => {
        const { rootLayer } = createRootLayer();

        expect(Array.from(rootLayer.getAllIds())).toEqual(["group-1", "tile-1", "tile-2"]);
        expect(rootLayer.findLayer("tile-1")?.parentLayer.id).toBe("group-1");
        expect(rootLayer.findLayer("missing-layer")).toBeNull();
        expect(rootLayer.serialize().map((layer) => layer.id)).toEqual(["group-1", "tile-2"]);
        const serializedGroup = rootLayer.serialize()[0];
        expect(serializedGroup).toMatchObject({ id: "group-1", type: "group" });
        if (serializedGroup.type !== "group") throw new Error("Expected group-1 to serialize as a group");
        expect(serializedGroup.layers?.map((layer) => layer.id)).toEqual(["tile-1"]);
    });

    it("moves direct children within bounds and leaves order unchanged outside bounds", () => {
        const { rootLayer } = createRootLayer();
        const reordered = vi.fn();
        rootLayer.eventEmitter.on("layerReordered", reordered);

        rootLayer.moveChild("group-1", 1);
        expect(rootLayer.getLayers().map((layer) => layer.id)).toEqual(["tile-2", "group-1"]);
        expect(reordered).toHaveBeenCalledTimes(1);

        rootLayer.moveChild("group-1", 1);
        rootLayer.moveChild("missing-layer", 1);
        expect(rootLayer.getLayers().map((layer) => layer.id)).toEqual(["tile-2", "group-1"]);
        expect(reordered).toHaveBeenCalledTimes(1);
    });

    it("inserts and removes direct children with explicit result statuses", () => {
        const { rootLayer, context } = createRootLayer();
        const insertedLayer = new TileLayer(
            {
                id: "inserted-tile",
                type: "tile",
                name: "Inserted",
                x: 0,
                y: 0,
                width: 1,
                height: 1,
                opacity: 1,
                visible: true,
                locked: false,
                offsetx: 0,
                offsety: 0,
                layerData: "0",
            },
            rootLayer,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );

        expect(rootLayer.insertLayer(insertedLayer, 1).status).toBe("Success");
        expect(rootLayer.getLayers().map((layer) => layer.id)).toEqual(["group-1", "inserted-tile", "tile-2"]);

        expect(rootLayer.removeLayer("inserted-tile").status).toBe("Success");
        expect(rootLayer.removeLayer("inserted-tile").status).toBe("Error");
        expect(rootLayer.insertLayer(insertedLayer, -1).status).toBe("Error");
    });
});
