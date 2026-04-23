import { type } from "arktype";

import { TilemapSessionManagerSchema } from "./tilemapSessionSchema";
import { TilesetSessionManagerSchema } from "./tilesetSessionSchema";
import { ToolStateSchema } from "./toolSessionSchema";
import { RulesetSessionManagerSchema } from "./rulesetSessionSchema";
import { SavedPathSchema } from "./savedPathSchema";

export const WorkpsaceDataSchema = type("string.json.parse").to({
    savedPath: SavedPathSchema.default(() => ({ exportPaths: [] })),
    toolState: ToolStateSchema.default(() => ({ currentTool: null })),
    tilesets: TilesetSessionManagerSchema.default(() => ({ tilesetSessions: [], currentTilesetSessionId: null })),
    tilemaps: TilemapSessionManagerSchema.default(() => ({ tilemapSessions: [], currentTilemapSessionId: null })),
    ruleset: RulesetSessionManagerSchema,
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
}
