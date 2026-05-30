import { ProjectData, ProjectMetadata } from "@/shared/data-types/project.data";
import { validate } from "@/shared/utils/validate.utils";
import { TilemapMetadata } from "@/shared/data-types/tilemap.data";
import { TilesetMetadata } from "@/shared/data-types/tileset.data";
import { RulesetMetadata } from "@/shared/data-types/ruleset.data";

const normalizeTilemapMetadata = (value: unknown): TilemapMetadata | null => {
    try {
        const data = validate.requiredObject({ value, field: "project.tilemaps[]" });
        return {
            id: validate.requiredString({ value: data.id, field: "project.tilemaps[].id" }),
            name: validate.string({ value: data.name, defaultValue: "Untitled Tilemap" }),
            tilemapRelPath: validate.requiredString({ value: data.tilemapRelPath, field: "project.tilemaps[].tilemapRelPath" }),
        };
    } catch {
        return null;
    }
};

export const normalizeProjectMetadata = (value: unknown): ProjectMetadata | null => {
    try {
        const data = validate.requiredObject({ value, field: "project metadata" });
        const now = new Date().toDateString();
        return {
            id: validate.requiredString({ value: data.id, field: "projectMetadata.id" }),
            name: validate.string({ value: data.name, defaultValue: "Untitled Project" }),
            version: validate.string({ value: data.version, defaultValue: "0.1.0" }),
            description: validate.string({ value: data.description, defaultValue: "" }),
            createdAt: validate.string({ value: data.createdAt, defaultValue: now }),
            updatedAt: validate.string({ value: data.updatedAt, defaultValue: now }),
            directory: validate.requiredString({ value: data.directory, field: "projectMetadata.directory" }),
        };
    } catch {
        return null;
    }
};

export const normalizeProjectMetadataRepo = (value: unknown): ProjectMetadata[] => {
    return validate.array<unknown>({ value, defaultValue: [] })
        .map(normalizeProjectMetadata)
        .filter((metadata): metadata is ProjectMetadata => metadata !== null);
};

const normalizeTilesetMetadata = (value: unknown): TilesetMetadata | null => {
    try {
        const data = validate.requiredObject({ value, field: "project.tilesets[]" });
        return {
            id: validate.requiredString({ value: data.id, field: "project.tilesets[].id" }),
            name: validate.string({ value: data.name, defaultValue: "Untitled Tileset" }),
            tilesetRelPath: validate.requiredString({ value: data.tilesetRelPath, field: "project.tilesets[].tilesetRelPath" }),
        };
    } catch {
        return null;
    }
};

const normalizeRulesetMetadata = (value: unknown): RulesetMetadata | null => {
    try {
        const data = validate.requiredObject({ value, field: "project.rulesets[]" });
        return {
            id: validate.requiredString({ value: data.id, field: "project.rulesets[].id" }),
            name: validate.string({ value: data.name, defaultValue: "Untitled Ruleset" }),
            color: validate.string({ value: data.color, defaultValue: "#ffffff" }),
            rulesetRelPath: validate.requiredString({ value: data.rulesetRelPath, field: "project.rulesets[].rulesetRelPath" }),
        };
    } catch {
        return null;
    }
};

export const normalizeProjectData = (projectData: unknown): ProjectData => {
    const data = validate.requiredObject({ value: projectData, field: "project" });
    const now = new Date().toDateString();

    return {
        id: validate.requiredString({ value: data.id, field: "project.id" }),
        name: validate.string({ value: data.name, defaultValue: "Untitled Project" }),
        version: validate.string({ value: data.version, defaultValue: "0.1.0" }),
        description: validate.string({ value: data.description, defaultValue: "" }),
        createdAt: validate.string({ value: data.createdAt, defaultValue: now }),
        updatedAt: validate.string({ value: data.updatedAt, defaultValue: now }),
        tilemaps: validate.array<unknown>({ value: data.tilemaps, defaultValue: [] }).map(normalizeTilemapMetadata).filter((metadata): metadata is TilemapMetadata => metadata !== null),
        tilesets: validate.array<unknown>({ value: data.tilesets, defaultValue: [] }).map(normalizeTilesetMetadata).filter((metadata): metadata is TilesetMetadata => metadata !== null),
        rulesets: validate.array<unknown>({ value: data.rulesets, defaultValue: [] }).map(normalizeRulesetMetadata).filter((metadata): metadata is RulesetMetadata => metadata !== null),
    };
};
