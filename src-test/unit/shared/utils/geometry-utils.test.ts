import { describe, expect, it } from "vitest";

import { GeometryUtils } from "@/shared/utils/geometry-utils";

describe("GeometryUtils", () => {
    it("calculates horizontal, vertical, and diagonal coordinate lines inclusively", () => {
        expect(GeometryUtils.calculateLine({ col: 0, row: 1 }, { col: 3, row: 1 })).toEqual([
            { col: 0, row: 1 },
            { col: 1, row: 1 },
            { col: 2, row: 1 },
            { col: 3, row: 1 },
        ]);

        expect(GeometryUtils.calculateLine({ col: 2, row: 0 }, { col: 2, row: 2 })).toEqual([
            { col: 2, row: 0 },
            { col: 2, row: 1 },
            { col: 2, row: 2 },
        ]);

        expect(GeometryUtils.calculateLine({ col: 0, row: 0 }, { col: 2, row: 2 })).toEqual([
            { col: 0, row: 0 },
            { col: 1, row: 1 },
            { col: 2, row: 2 },
        ]);
    });

    it("calculates steep and reverse position lines", () => {
        expect(GeometryUtils.calculateLine({ x: 3, y: 3 }, { x: 1, y: 0 })).toEqual([
            { x: 3, y: 3 },
            { x: 2, y: 2 },
            { x: 2, y: 1 },
            { x: 1, y: 0 },
        ]);
    });

    it("returns a single point when start and end match", () => {
        expect(GeometryUtils.calculateLine({ col: 4, row: 5 }, { col: 4, row: 5 })).toEqual([
            { col: 4, row: 5 },
        ]);
    });
});
