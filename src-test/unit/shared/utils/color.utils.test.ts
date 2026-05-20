import { beforeEach, describe, expect, it, vi } from "vitest";

import { ColorUtils } from "@/shared/utils/color.utils";

describe("ColorUtils", () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, "CSS", {
            configurable: true,
            value: {
                supports: vi.fn((_property: string, value: string) => value === "#112233" || value === "rgb(1, 2, 3)"),
            },
        });
    });

    it("returns valid CSS custom property color values", () => {
        document.documentElement.style.setProperty("--accent", "#112233");

        expect(ColorUtils.getCSSColor("--accent")).toBe("#112233");
        expect(CSS.supports).toHaveBeenCalledWith("color", "#112233");
    });

    it("returns null for missing or invalid color values", () => {
        document.documentElement.style.setProperty("--not-color", "not-a-color");

        expect(ColorUtils.getCSSColor("--not-color")).toBeNull();
        expect(ColorUtils.getCSSColor("--missing-color")).toBeNull();
    });
});
