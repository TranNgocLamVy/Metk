import { type } from "arktype";

import { TilemapSessionManagerSchema } from "./tilemap-session.schema";
import { TilesetSessionManagerSchema } from "./tileset-session.schema";
import { RulesetSessionManagerSchema } from "./ruleset-session.schema";
import { safeArray } from "./utils";


export const ToolStateSchema = type({
    currentTool: type("string").or("null").default(null),
})
export type ToolStateData = typeof ToolStateSchema.infer

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

export const PropertyPanelStateSchema = type({
    selectedObjectId: type("string").or("null").default(null),
})


export const WorkpsaceDataSchema = type("string.json.parse").to({
    tilesets: TilesetSessionManagerSchema.default(() => ({ tilesetSessions: [], currentTilesetSessionId: null })),
    tilemaps: TilemapSessionManagerSchema.default(() => ({ tilemapSessions: [], currentTilemapSessionId: null })),
    ruleset: RulesetSessionManagerSchema,
    toolState: ToolStateSchema.default(() => ({ currentTool: null })),
    savedPath: SavedPathSchema.default(() => ({ exportPaths: [] })),
    propertyPanel: PropertyPanelStateSchema.default(() => ({ selectedObjectId: null })),
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
    ruleset: {
        selectedRuleId: null,
    },
    toolState: {
        currentTool: null,
    },
    savedPath: {
        exportPaths: [],
        tilemapDir: null,
        tilesetDir: null,
        rulesetDir: null,
        textureDir: null,
    },
    propertyPanel: {
        selectedObjectId: null,
    }
}
