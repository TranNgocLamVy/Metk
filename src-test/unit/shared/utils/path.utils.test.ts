import { describe, expect, it } from "vitest";

import { PathUtils } from "@/shared/utils/path.utils";

describe("PathUtils", () => {
    it("normalizes and joins nested relative paths deterministically", () => {
        expect(PathUtils.normalize("project//tilemaps/../tilesets/terrain.ts.json")).toBe("project/tilesets/terrain.ts.json");
        expect(PathUtils.join("project", ".metk", "../tilemaps", "world.tm.json")).toBe("project/tilemaps/world.tm.json");
    });

    it("handles Windows-style input paths with pathe-normalized output", () => {
        expect(PathUtils.basename("C:\\Project\\Metk\\maps\\world.tm.json")).toBe("world.tm.json");
        expect(PathUtils.dirname("C:\\Project\\Metk\\maps\\world.tm.json")).toBe("C:/Project/Metk/maps");
        expect(PathUtils.extname("C:\\Project\\Metk\\maps\\world.tm.json")).toBe(".json");
    });

    it("computes relative paths between nested project paths", () => {
        expect(PathUtils.relative("C:/Project/Metk", "C:/Project/Metk/assets/tilesets/terrain.ts.json")).toBe("assets/tilesets/terrain.ts.json");
        expect(PathUtils.relative("project/tilemaps", "project/textures/terrain.png")).toBe("../textures/terrain.png");
    });

    it("formats user-facing paths using the detected platform separator", () => {
        expect(["/", "\\"]).toContain(PathUtils.separator);
        expect(PathUtils.toUserFriendlyPath("project/assets/terrain.png")).toBe(
            PathUtils.separator === "\\" ? "project\\assets\\terrain.png" : "project/assets/terrain.png",
        );
    });
});
