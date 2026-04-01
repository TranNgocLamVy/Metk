import { type } from "arktype";

import { TilemapSessionManagerSchema } from "./tilemapSessionSchema";
import { TilesetSessionManagerSchema } from "./tilesetSessionSchema";
import { ToolStateSchema } from "./toolSessionSchema";
import { safeArray } from ".";

export const ExportPathSchema = type({
    tilemapId: type("string"),
    exportPath: type("string").or("null").default(null),
})

export type ExportPathData = typeof ExportPathSchema.infer

export const WorkpsaceDataSchema = type("string.json.parse").to({
    exportPaths: safeArray(ExportPathSchema),
    toolState: ToolStateSchema.default(() => ({ currentTool: null })),
    tilesets: TilesetSessionManagerSchema.default(() => ({ tilesetSessions: [], currentTilesetSessionId: null })),
    tilemaps: TilemapSessionManagerSchema.default(() => ({ tilemapSessions: [], currentTilemapSessionId: null })),
})

export type WorkpsaceData = typeof WorkpsaceDataSchema.infer

export const defaultWorkspaceData: WorkpsaceData = {
    tilesets: {
        tilesetSessions: [],
        currentTilesetSessionId: null,
    },
    tilemaps: {
        tilemapSessions: [],
        currentTilemapSessionId: null,
    },
    toolState: {
        currentTool: null,
    },
    exportPaths: [],
}
