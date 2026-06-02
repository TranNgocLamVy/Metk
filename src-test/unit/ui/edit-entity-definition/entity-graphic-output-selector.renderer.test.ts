import { describe, expect, it } from "vitest";

import type { Tileset } from "@/editor/model/tileset/tileset";
import { getTileSize } from "@/ui/dialogs/edit-entity-definition/graphics/entity-graphic-output-selector.renderer";

function createTileset(
    tileWidth: number,
    tileHeight: number,
    tile: { id: number; imageSource?: { width: number; height: number } | null } | null = null,
): Tileset {
    return {
        tileWidth,
        tileHeight,
        getTileFromId: (id: number) => (tile?.id === id ? tile : null),
    } as unknown as Tileset;
}

describe("getTileSize", () => {
    it("uses the selected image collection tile size when available", () => {
        const tileset = createTileset(32, 32, {
            id: 7,
            imageSource: { width: 18, height: 26 },
        });

        expect(getTileSize(tileset, 7)).toEqual({ width: 18, height: 26 });
    });

    it("falls back to the tileset tile size", () => {
        const tileset = createTileset(16, 24);

        expect(getTileSize(tileset, 3)).toEqual({ width: 16, height: 24 });
    });
});
