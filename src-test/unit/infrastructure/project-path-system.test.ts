import { describe, expect, it } from "vitest";

import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";

describe("ProjectPathSystem and FilePathSystem", () => {
    it("resolves project-relative paths and stores child file nodes", () => {
        const project = new ProjectPathSystem("C:/Project/Metk/sample-project");
        const tilemap = new FilePathSystem("map-a", project, "tilemaps/world/map-a.tm.json");

        expect(project.getNodeById("map-a")).toBe(tilemap);
        expect(project.getAbsPathFromRelPath("tilesets/terrain.ts.json")).toBe("C:/Project/Metk/sample-project/tilesets/terrain.ts.json");
        expect(project.getRelPathFromAbsPath("C:/Project/Metk/sample-project/tilemaps/world/map-a.tm.json")).toBe("tilemaps/world/map-a.tm.json");
    });

    it("exposes file path metadata and resolves nested relative assets", () => {
        const project = new ProjectPathSystem("C:/Project/Metk/sample-project");
        const tileset = new FilePathSystem("terrain", project, "assets/tilesets/terrain.ts.json");

        expect(tileset.fileName).toBe("terrain.ts.json");
        expect(tileset.fileExtension).toBe(".json");
        expect(tileset.relDir).toBe("assets/tilesets");
        expect(tileset.relPath).toBe("assets/tilesets/terrain.ts.json");
        expect(tileset.getFileAbsPath()).toBe("C:/Project/Metk/sample-project/assets/tilesets/terrain.ts.json");
        expect(tileset.getFileAbsDir()).toBe("C:/Project/Metk/sample-project/assets/tilesets");
        expect(tileset.getAbsPathFromRelPath("../textures/terrain.png")).toBe("C:/Project/Metk/sample-project/assets/textures/terrain.png");
    });
});
