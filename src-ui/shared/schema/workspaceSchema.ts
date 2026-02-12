import { type } from "arktype";

import { TilemapSessionManagerSchema } from "./tilemapSessionSchema";
import { TilesetSessionManagerSchema } from "./tilesetSessionSchema";
import { ToolStateSchema } from "./toolSessionSchema";

export const ExportPathSchema = type({
    tilemapId: type("string"),
    exportPath: type("string"),
})

export type ExportPathData = typeof ExportPathSchema.infer

export const WorkpsaceSchema = type({
    exportPaths: ExportPathSchema.array(),
    toolState: ToolStateSchema,
    tilesets: TilesetSessionManagerSchema,
    tilemaps: TilemapSessionManagerSchema
})
export const WorkspaceRepoSchema = type("string.json.parse").to(WorkpsaceSchema)

export type WorkpsaceData = typeof WorkpsaceSchema.infer
