import { describe, expect, it, vi } from "vitest";

import { Project } from "@/editor/model/project/project";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { ProjectData } from "@/shared/schema/project.schema";

const createProjectData = (): ProjectData => ({
    id: "project-1",
    name: "Project One",
    version: "1.0.0",
    description: "A deterministic project fixture",
    createdAt: "Mon Jan 01 2024",
    updatedAt: "Tue Jan 02 2024",
    tilemaps: [{ id: "map-1", name: "Map One", tilemapRelPath: "maps/map-1.json" }],
    tilesets: [{ id: "tileset-1", name: "Tileset One", tilesetRelPath: "tilesets/tileset-1.json" }],
    rulesets: [{ id: "ruleset-1", name: "Ruleset One", color: "#ff00ff", rulesetRelPath: "rulesets/ruleset-1.json" }],
});

describe("Project", () => {
    it("exposes stable metadata including the project directory", () => {
        const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/sample-project");
        const project = new Project(createProjectData(), projectPathSystem);

        expect(project.metaData).toEqual({
            id: "project-1",
            name: "Project One",
            version: "1.0.0",
            description: "A deterministic project fixture",
            createdAt: "Mon Jan 01 2024",
            updatedAt: "Tue Jan 02 2024",
            directory: "C:/Project/Metk/sample-project",
        });
    });

    it("serializes current project fields and resource metadata", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-19T09:00:00Z"));

        const project = new Project(createProjectData(), new ProjectPathSystem("C:/Project/Metk/sample-project"));
        project.name = "Renamed Project";
        project.description = "Updated description";
        project.tilesetManager.loadTilesetsMetadata([
            { id: "tileset-2", name: "Tileset Two", tilesetRelPath: "tilesets/tileset-2.json" },
        ]);
        project.tilemapManager.loadTilemapsMetada([
            { id: "map-2", name: "Map Two", tilemapRelPath: "maps/map-2.json" },
        ]);
        project.rulesetManager.loadRulesetMetadata([
            { id: "ruleset-2", name: "Ruleset Two", color: "#00ff00", rulesetRelPath: "rulesets/ruleset-2.json" },
        ]);

        expect(project.serialize()).toEqual({
            id: "project-1",
            name: "Renamed Project",
            version: "1.0.0",
            description: "Updated description",
            createdAt: "Mon Jan 01 2024",
            updatedAt: "Tue May 19 2026",
            tilemaps: [{ id: "map-2", name: "Map Two", tilemapRelPath: "maps/map-2.json" }],
            tilesets: [{ id: "tileset-2", name: "Tileset Two", tilesetRelPath: "tilesets/tileset-2.json" }],
            rulesets: [{ id: "ruleset-2", name: "Ruleset Two", color: "#00ff00", rulesetRelPath: "rulesets/ruleset-2.json" }],
        });

        vi.useRealTimers();
    });
});
