import { type } from "arktype";

export const ProjectDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string"),
    version: type("string").default("0.1.0"),
    description: type("string").default(""),
    createdAt: type("string.date"),
    updatedAt: type("string.date"),
    tilemapPaths: type("string[]").default(() => []),
    tilesetPaths: type("string[]").default(() => []),
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
})
export const ProjectMetaDataSchema = type("string.json.parse").to(ProjectMetaDataBase)
export type ProjectMetaData = typeof ProjectMetaDataSchema.infer

export const ProjectRepoSchema = type("string.json.parse").to(
    ProjectMetaDataBase.array()
)
export type ProjectRepoData = typeof ProjectRepoSchema.infer