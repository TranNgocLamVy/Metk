import { RulesetSessionManagerData } from "./ruleset-session.data";
import { TilemapSessionManagerData } from "./tilemap-session.data";
import { TilesetSessionManagerData } from "./tileset-session.data";

export type ToolStateData = {
    currentTool: string | null;
};

export type ExportPathData = {
    tilemapId: string;
    exportPath: string | null;
};

export type SavedPathData = {
    exportPaths: ExportPathData[];
    tilemapDir: string | null;
    tilesetDir: string | null;
    rulesetDir: string | null;
    textureDir: string | null;
};

export type PropertyPanelStateData = {
    selectedObjectId: string | null;
};

export type WorkpsaceData = {
    tilesets: TilesetSessionManagerData;
    tilemaps: TilemapSessionManagerData;
    ruleset: RulesetSessionManagerData;
    toolState: ToolStateData;
    savedPath: SavedPathData;
    propertyPanel: PropertyPanelStateData;
};

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
    },
};
