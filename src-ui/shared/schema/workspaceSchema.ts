import { type } from "arktype";

import { TilemapSessionManagerSchema } from "./tilemap-session.schema";
import { TilesetSessionManagerSchema } from "./tileset-session.schema";
import { ToolStateSchema } from "./tool-session.schema";
import { RulesetSessionManagerSchema } from "./ruleset-session.schema";
import { SavedPathSchema } from "./saved-path.schema";

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
