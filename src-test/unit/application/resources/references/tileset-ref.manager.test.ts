import { describe, expect, it, vi } from "vitest";

import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";

const createManager = () => {
    const tilesetManager = {
        getTilesetMetadataById: vi.fn((id: string) => {
            if (id.startsWith("missing")) return null;
            return { id, name: `${id} name`, tilesetRelPath: `tilesets/${id}.json` };
        }),
    };

    return {
        manager: new TilesetRefManager(tilesetManager as any, {} as any),
        tilesetManager,
    };
};

describe("TilesetRefManager", () => {
    it("normalizes empty loaded data and assigns new references from zero", () => {
        const { manager } = createManager();

        manager.loadData(null as any, Number.NaN);

        expect(manager.getTilesetRefIndex("terrain")).toBe(0);
        expect(manager.serialize()).toEqual({
            refs: [{ index: 0, id: "terrain", name: "terrain name" }],
            nextIndex: 1,
        });
    });

    it("returns existing reference indexes without duplicating entries", () => {
        const { manager, tilesetManager } = createManager();
        manager.loadData([{ index: 4, id: "terrain", name: "Terrain" }], 7);

        expect(manager.getTilesetRefIndex("terrain")).toBe(4);
        expect(manager.getRefIds()).toEqual(["terrain"]);
        expect(tilesetManager.getTilesetMetadataById).not.toHaveBeenCalled();
        expect(manager.serialize().nextIndex).toBe(7);
    });

    it("returns -1 when metadata is unavailable for a new reference", () => {
        const { manager } = createManager();
        manager.loadData([], 0);

        expect(manager.getTilesetRefIndex("missing-terrain")).toBe(-1);
        expect(manager.serialize()).toEqual({ refs: [], nextIndex: 0 });
    });

    it("replaces and removes references while preserving assigned indexes", () => {
        const { manager } = createManager();
        manager.loadData([
            { index: 0, id: "terrain", name: "Terrain" },
            { index: 3, id: "decor", name: "Decor" },
        ], 5);

        manager.replaceTilesetRef("terrain", "water");

        expect(manager.getTilesetRefId(0)).toBe("water");
        expect(manager.removeTilesetRef("water")).toBe(0);
        expect(manager.removeTilesetRef(3)).toBe(3);
        expect(manager.removeTilesetRef("missing-terrain")).toBe(-1);
        expect(manager.serialize()).toEqual({ refs: [], nextIndex: 5 });
    });
});
