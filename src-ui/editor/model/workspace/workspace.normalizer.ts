import { TilemapSessionData } from "@/shared/data-types/tilemap-session.data";
import { TilesetSessionData } from "@/shared/data-types/tileset-session.data";
import { defaultWorkspaceData, WorkpsaceData } from "@/shared/data-types/workspace.data";
import { validate } from "@/shared/utils/validate.utils";


const nullableString = (value: unknown): string | null => {
    return typeof value === "string" ? value : null;
};

const normalizeViewState = (value: unknown) => {
    const data = validate.object<Record<string, unknown>>({ value, defaultValue: {} });
    return {
        x: typeof data.x === "number" && Number.isFinite(data.x) ? data.x : null,
        y: typeof data.y === "number" && Number.isFinite(data.y) ? data.y : null,
        zoom: validate.number({ value: data.zoom, defaultValue: 1, min: 0.01 }),
    };
};

export const normalizeTilemapSession = (value: unknown): TilemapSessionData | null => {
    try {
        const data = validate.requiredObject({ value, field: "workspace.tilemaps.tilemapSessions[]" });
        const layerState = validate.object<Record<string, unknown>>({ value: data.layerState, defaultValue: {} });
        return {
            id: validate.requiredString({ value: data.id, field: "workspace.tilemaps.tilemapSessions[].id" }),
            tilemapId: validate.requiredString({ value: data.tilemapId, field: "workspace.tilemaps.tilemapSessions[].tilemapId" }),
            viewState: normalizeViewState(data.viewState),
            layerState: {
                selectedLayers: validate.array<unknown>({ value: layerState.selectedLayers, defaultValue: [] })
                    .filter((id): id is string => typeof id === "string"),
            },
        };
    } catch {
        return null;
    }
};

export const normalizeTilesetSession = (value: unknown): TilesetSessionData | null => {
    try {
        const data = validate.requiredObject({ value, field: "workspace.tilesets.tilesetSessions[]" });
        const selectionState = validate.object<Record<string, unknown>>({ value: data.selectionState, defaultValue: {} });
        return {
            id: validate.requiredString({ value: data.id, field: "workspace.tilesets.tilesetSessions[].id" }),
            tilesetId: validate.requiredString({ value: data.tilesetId, field: "workspace.tilesets.tilesetSessions[].tilesetId" }),
            viewState: data.viewState === null ? null : normalizeViewState(data.viewState),
            selectionState: {
                selectedTilesSet: validate.array<unknown>({ value: selectionState.selectedTilesSet, defaultValue: [] })
                    .filter((id): id is number => typeof id === "number" && Number.isFinite(id)),
            },
        };
    } catch {
        return null;
    }
};

export const normalizeWorkspaceData = (workspaceData: unknown): WorkpsaceData => {
    const data = validate.object<Record<string, unknown>>({ value: workspaceData, defaultValue: defaultWorkspaceData });
    const tilesets = validate.object<Record<string, unknown>>({ value: data.tilesets, defaultValue: {} });
    const tilemaps = validate.object<Record<string, unknown>>({ value: data.tilemaps, defaultValue: {} });
    const ruleset = validate.object<Record<string, unknown>>({ value: data.ruleset, defaultValue: {} });
    const entityCollection = validate.object<Record<string, unknown>>({ value: data.entityCollection, defaultValue: {} });
    const toolState = validate.object<Record<string, unknown>>({ value: data.toolState, defaultValue: {} });
    const savedPath = validate.object<Record<string, unknown>>({ value: data.savedPath, defaultValue: {} });
    const propertyPanel = validate.object<Record<string, unknown>>({ value: data.propertyPanel, defaultValue: {} });

    return {
        tilesets: {
            tilesetSessions: validate.array<unknown>({ value: tilesets.tilesetSessions, defaultValue: [] })
                .map(normalizeTilesetSession)
                .filter((session): session is TilesetSessionData => session !== null),
            currentTilesetSessionId: nullableString(tilesets.currentTilesetSessionId),
        },
        tilemaps: {
            tilemapSessions: validate.array<unknown>({ value: tilemaps.tilemapSessions, defaultValue: [] })
                .map(normalizeTilemapSession)
                .filter((session): session is TilemapSessionData => session !== null),
            currentTilemapSessionId: nullableString(tilemaps.currentTilemapSessionId),
        },
        ruleset: {
            selectedRuleId: nullableString(ruleset.selectedRuleId),
        },
        entityCollection: {
            selectedEntityCollectionId: nullableString(entityCollection.selectedEntityCollectionId),
            selectedEntityId: nullableString(entityCollection.selectedEntityId),
        },
        toolState: {
            currentToolFamily: nullableString(toolState.currentToolFamily),
        },
        savedPath: {
            exportPaths: validate.array<unknown>({ value: savedPath.exportPaths, defaultValue: [] })
                .map((value) => {
                    try {
                        const exportPath = validate.requiredObject({ value, field: "workspace.savedPath.exportPaths[]" });
                        return {
                            tilemapId: validate.requiredString({ value: exportPath.tilemapId, field: "workspace.savedPath.exportPaths[].tilemapId" }),
                            exportPath: nullableString(exportPath.exportPath),
                        };
                    } catch {
                        return null;
                    }
                })
                .filter((path): path is { tilemapId: string; exportPath: string | null } => path !== null),
            tilemapDir: nullableString(savedPath.tilemapDir),
            tilesetDir: nullableString(savedPath.tilesetDir),
            rulesetDir: nullableString(savedPath.rulesetDir),
            textureDir: nullableString(savedPath.textureDir),
        },
        propertyPanel: {
            selectedObjectId: nullableString(propertyPanel.selectedObjectId),
        },
    };
};
