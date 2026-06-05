import { EntityCollectionSessionManagerData } from "./entity-collection-session.data";
import { LayerKind } from "./layer.data";
import { RulesetSessionManagerData } from "./ruleset-session.data";
import { TilemapSessionManagerData } from "./tilemap-session.data";
import { TilesetSessionManagerData } from "./tileset-session.data";


export type ToolStateData = Partial<Record<LayerKind, string>>;

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

export type TilemapEditorWorkspaceData = {
    tilesets: TilesetSessionManagerData;
    tilemaps: TilemapSessionManagerData;
    ruleset: RulesetSessionManagerData;
    entityCollection: EntityCollectionSessionManagerData;
    toolState: ToolStateData;
    propertyPanel: PropertyPanelStateData;
};

export type WorkpsaceData = {
    tilemapEditorWorkspace: TilemapEditorWorkspaceData;
    savedPath: SavedPathData;
};

export const defaultTilemapEditorWorkspaceData: TilemapEditorWorkspaceData = {
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
    entityCollection: {
        selectedEntityCollectionId: null,
        selectedEntityId: null,
    },
    toolState: {},
    propertyPanel: {
        selectedObjectId: null,
    },
};

export const defaultWorkspaceData: WorkpsaceData = {
    tilemapEditorWorkspace: defaultTilemapEditorWorkspaceData,
    savedPath: {
        exportPaths: [],
        tilemapDir: null,
        tilesetDir: null,
        rulesetDir: null,
        textureDir: null,
    },
};
