import { describe, expect, it } from "vitest";

import { WorkspaceSavedPathManager } from "@/application/workspace/workspace-saved-path.manager";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";

describe("WorkspaceSavedPathManager", () => {
    it("returns project directory defaults when saved directories are absent", () => {
        const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/example");
        const manager = new WorkspaceSavedPathManager({
            exportPaths: [],
            tilemapDir: null,
            tilesetDir: null,
            rulesetDir: null,
            textureDir: null,
        }, projectPathSystem);

        expect(manager.getTilemapDir()).toBe(projectPathSystem.absDir);
        expect(manager.getTilesetDir()).toBe(projectPathSystem.absDir);
        expect(manager.getRulesetDir()).toBe(projectPathSystem.absDir);
        expect(manager.getTextureDir()).toBe(projectPathSystem.absDir);
    });

    it("loads only concrete export paths and serializes path updates", () => {
        const manager = new WorkspaceSavedPathManager({
            exportPaths: [
                { tilemapId: "map-a", exportPath: "C:/exports/map-a.tmx" },
                { tilemapId: "map-b", exportPath: null },
            ],
            tilemapDir: "C:/maps",
            tilesetDir: null,
            rulesetDir: null,
            textureDir: null,
        }, new ProjectPathSystem("C:/Project/Metk/example"));

        manager.setExportPath("map-c", "C:/exports/map-c.tmx");
        manager.setTilesetDir("C:/tilesets");
        manager.setRulesetDir("C:/rulesets");
        manager.setTextureDir("C:/textures");

        expect(manager.getExportPath("map-a")).toBe("C:/exports/map-a.tmx");
        expect(manager.getExportPath("map-b")).toBeNull();
        expect(manager.serialize()).toEqual({
            exportPaths: [
                { tilemapId: "map-a", exportPath: "C:/exports/map-a.tmx" },
                { tilemapId: "map-c", exportPath: "C:/exports/map-c.tmx" },
            ],
            tilemapDir: "C:/maps",
            tilesetDir: "C:/tilesets",
            rulesetDir: "C:/rulesets",
            textureDir: "C:/textures",
        });
    });
});
