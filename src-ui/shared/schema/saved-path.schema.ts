import { type } from "arktype"
import { safeArray } from "./utils"



export const ExportPathSchema = type({
    tilemapId: type("string"),
    exportPath: type("string").or("null").default(null),
})

export type ExportPathData = typeof ExportPathSchema.infer


export const SavedPathSchema = type({
    exportPaths: safeArray(ExportPathSchema),
    tilemapDir: type("string").or("null").default(null),
    tilesetDir: type("string").or("null").default(null),
    rulesetDir: type("string").or("null").default(null),
    textureDir: type("string").or("null").default(null),
})

export type SavedPathData = typeof SavedPathSchema.infer