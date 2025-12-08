import { type } from "arktype";

import { TilemapMetaDataSchema } from "./tilemapSchema";
import { TilesetMetaDataSchema } from "./tilesetSchema";

export const ProjectDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string"),
    version: type("string").default("0.1.0"),
    description: type("string").default(""),
    createdAt: type("string.date").default(() => new Date().toDateString()),
    updatedAt: type("string.date").default(() => new Date().toDateString()),
    tilemaps: TilemapMetaDataSchema.array().default(() => []),
    tilesets: TilesetMetaDataSchema.array().default(() => []),
})
export type ProjectData = typeof ProjectDataSchema.infer

const ProjectMetaDataBase = type({
    id: "string",
    name: "string",
    version: type("string").default("0.1.0"),
    description: type("string").default(""),
    createdAt: "string.date",
    updatedAt: "string.date",
    directory: "string",
    found: type("boolean").optional(),
})
export const ProjectMetaDataSchema = type("string.json.parse").to(ProjectMetaDataBase)
export type ProjectMetaData = typeof ProjectMetaDataSchema.infer

export const ProjectRepoSchema = type("string.json.parse").to(
    ProjectMetaDataBase.array()
)
export type ProjectRepoData = typeof ProjectRepoSchema.infer