import { v4 as uuidv4 } from "uuid";
import { type } from "arktype";

import { TilemapMetadataSchema } from "./tilemapSchema";
import { TilesetMetadataSchema } from "./tilesetSchema";
import { safeArray } from ".";
import { RulesetMetadataSchema } from "./rulesetSchema";

export const ProjectDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string"),
    version: type("string").default("0.1.0"),
    description: type("string").default(""),
    createdAt: type("string.date").default(() => new Date().toDateString()),
    updatedAt: type("string.date").default(() => new Date().toDateString()),
    tilemaps: safeArray(TilemapMetadataSchema).default(() => []),
    tilesets: safeArray(TilesetMetadataSchema).default(() => []),
    rulesets: safeArray(RulesetMetadataSchema).default(() => []),
})
export type ProjectData = typeof ProjectDataSchema.infer

const ProjectMetadataBase = type({
    id: type("string"),
    name: type("string").default("Untitled Project"),
    version: type("string").default("0.1.0"),
    description: type("string").default(""),
    createdAt: type("string.date").default(() => new Date().toDateString()),
    updatedAt: type("string.date").default(() => new Date().toDateString()),
    directory: type("string"),
})
export const ProjectMetadataSchema = type("string.json.parse").to(ProjectMetadataBase)
export type ProjectMetadata = typeof ProjectMetadataSchema.infer

export const ProjectRepoSchema = type("string.json.parse").to(safeArray(ProjectMetadataBase))
export type ProjectRepoData = typeof ProjectRepoSchema.infer


export const defaultProjectData = (payload: Partial<ProjectData>): ProjectData => ({
    id: uuidv4(),
    name: payload.name || "Untitled Project",
    version: "0.1.0",
    description: "",
    createdAt: new Date().toDateString(),
    updatedAt: new Date().toDateString(),
    tilemaps: [],
    tilesets: [],
    rulesets: [],
});