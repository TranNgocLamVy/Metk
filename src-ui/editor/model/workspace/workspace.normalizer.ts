import { createBuiltinToolFamilyIdSetForLayerKinds } from "@/graphics/tool/builtin-tools";
import { LayerKind } from "@/shared/data-types/layer.data";
import { TilemapSessionData } from "@/shared/data-types/tilemap-session.data";
import { TilesetSessionData } from "@/shared/data-types/tileset-session.data";
import { defaultWorkspaceData, ToolStateData, WorkpsaceData } from "@/shared/data-types/workspace.data";
import { validate } from "@/shared/utils/validate.utils";

const tileAndRuleToolFamilyIds = createBuiltinToolFamilyIdSetForLayerKinds(LayerKind)

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
        const data = validate.requiredObject({ value, field: "workspace.tilemapEditorWorkspace.tilemaps.tilemapSessions[]" });
        const layerState = validate.object<Record<string, unknown>>({ value: data.layerState, defaultValue: {} });
        return {
            id: validate.requiredString({ value: data.id, field: "workspace.tilemapEditorWorkspace.tilemaps.tilemapSessions[].id" }),
            tilemapId: validate.requiredString({ value: data.tilemapId, field: "workspace.tilemapEditorWorkspace.tilemaps.tilemapSessions[].tilemapId" }),
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
        const data = validate.requiredObject({ value, field: "workspace.tilemapEditorWorkspace.tilesets.tilesetSessions[]" });
        const selectionState = validate.object<Record<string, unknown>>({ value: data.selectionState, defaultValue: {} });
        return {
            id: validate.requiredString({ value: data.id, field: "workspace.tilemapEditorWorkspace.tilesets.tilesetSessions[].id" }),
            tilesetId: validate.requiredString({ value: data.tilesetId, field: "workspace.tilemapEditorWorkspace.tilesets.tilesetSessions[].tilesetId" }),
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

const normalizeToolState = (value: unknown): ToolStateData => {
    const data = validate.object<Record<string, unknown>>({ value, defaultValue: {} });
    const normalized: ToolStateData = {};

    LayerKind.forEach((layerKind) => {
        const toolFamilyId = nullableString(data[layerKind]);
        if (toolFamilyId) normalized[layerKind] = toolFamilyId;
    });

    const legacyCurrentToolFamily = nullableString(data.currentToolFamily);
    if (legacyCurrentToolFamily && tileAndRuleToolFamilyIds.has(legacyCurrentToolFamily)) {
        LayerKind.forEach((layerKind) => {
            normalized[layerKind] ??= legacyCurrentToolFamily;
        });
    }

    return normalized;
};

export const normalizeWorkspaceData = (workspaceData: unknown): WorkpsaceData => {
    const data = validate.object<Record<string, unknown>>({ value: workspaceData, defaultValue: defaultWorkspaceData });
    const tilemapEditorWorkspace = validate.object<Record<string, unknown>>({
        value: data.tilemapEditorWorkspace,
        defaultValue: {},
    });
    const tilesets = validate.object<Record<string, unknown>>({ value: tilemapEditorWorkspace.tilesets ?? data.tilesets, defaultValue: {} });
    const tilemaps = validate.object<Record<string, unknown>>({ value: tilemapEditorWorkspace.tilemaps ?? data.tilemaps, defaultValue: {} });
    const ruleset = validate.object<Record<string, unknown>>({ value: tilemapEditorWorkspace.ruleset ?? data.ruleset, defaultValue: {} });
    const entityCollection = validate.object<Record<string, unknown>>({ value: tilemapEditorWorkspace.entityCollection ?? data.entityCollection, defaultValue: {} });
    const toolState = tilemapEditorWorkspace.toolState ?? data.toolState;
    const savedPath = validate.object<Record<string, unknown>>({ value: data.savedPath, defaultValue: {} });
    const propertyPanel = validate.object<Record<string, unknown>>({ value: tilemapEditorWorkspace.propertyPanel ?? data.propertyPanel, defaultValue: {} });

    return {
        tilemapEditorWorkspace: {
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
            propertyPanel: {
                selectedObjectId: nullableString(propertyPanel.selectedObjectId),
            },
            toolState: normalizeToolState(toolState),
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
    };
};
