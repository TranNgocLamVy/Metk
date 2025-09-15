import { type } from "arktype";

export const ProjectSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string"),
    version: type("string").default("0.1.0"),
    description: type("string").default(""),
    createdAt: type("string.date"),
    updatedAt: type("string.date"),
    tilemapPaths: type("string[]").default(() => []),
    tilesetPaths: type("string[]").default(() => []),
})
export type ProjectData = typeof ProjectSchema.infer

export const ProjectMetaDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string"),
    version: type("string").default("0.1.0"),
    description: type("string").default(""),
    createdAt: type("string.date"),
    updatedAt: type("string.date"),
    directory: type("string"),
})
export type ProjectMetaData = typeof ProjectMetaDataSchema.infer

export const ProjectManagerSchema = type("string.json.parse").to({
    projectMetaDatas: ProjectMetaDataSchema.array().default(() => []),
})
export type ProjectManagerData = typeof ProjectManagerSchema.infer