import { defaultWorkspaceData, WorkpsaceData } from "@/shared/data-types/workspace.data";
import { Result } from "@/shared/types/result";

import { WorkspaceSavedPathManager } from "@/application/workspace/workspace-saved-path.manager";
import { TilemapManager } from "@/application/resources/tilemap/tilemap.manager";
import { TilemapSessionManager } from "@/application/workspace/session/tilemap-session.manager";
import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { TilesetSessionManager } from "@/application/workspace/session/tileset-session.manager";
import { EditorFacade } from "@/application/editor.facade";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { RulesetSessionManager } from "@/application/workspace/session/ruleset-session.manager";
import { ToolSessionManager } from "@/application/workspace/session/tool-session.manager";
import { WorkspacePropertyPanelManager } from "@/application/workspace/workspace-property-panel.manager";
import { validate } from "@/shared/utils/validate.utils";
import { TilemapSessionData } from "@/shared/data-types/tilemap-session.data";
import { TilesetSessionData } from "@/shared/data-types/tileset-session.data";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    public rulesetSessionManager: RulesetSessionManager;
    public toolSessionManager: ToolSessionManager;
    public savedPathManager: WorkspaceSavedPathManager;
    public propertyPanelManager: WorkspacePropertyPanelManager;
    private constructor (
        data: WorkpsaceData,
        private readonly tilesetManager: TilesetManager, 
        private readonly tilemapManager: TilemapManager,
        public readonly projectPathSystem: ProjectPathSystem,
        private readonly editorFacade: EditorFacade,
    ) {
        this.tilesetSessionManager = new TilesetSessionManager(data.tilesets, this.editorFacade);
        this.tilemapSessionManager = new TilemapSessionManager(data.tilemaps, this.editorFacade);
        this.rulesetSessionManager = new RulesetSessionManager(data.ruleset, this.editorFacade);
        this.toolSessionManager = new ToolSessionManager(data.toolState, this.editorFacade);
        this.savedPathManager = new WorkspaceSavedPathManager(data.savedPath, this.projectPathSystem);
        this.propertyPanelManager = new WorkspacePropertyPanelManager(data.propertyPanel, this.editorFacade);
    }

    public static create(
        workspaceData: unknown,
        tilesetManager: TilesetManager,
        tilemapManager: TilemapManager,
        projectPathSystem: ProjectPathSystem,
        editorFacade: EditorFacade,
    ): Result<Workspace> {
        try {
            const data = normalizeWorkspaceData(workspaceData);
            return Result.Success(new Workspace(data, tilesetManager, tilemapManager, projectPathSystem, editorFacade));
        } catch (error) {
            return Result.Error(`Failed to create workspace: ${String(error)}`);
        }
    }

    public async loadSession(): Promise<Result> {
        await this.tilesetSessionManager.loadTilesetSessions(this.tilesetManager);
        await this.tilemapSessionManager.loadTilemapSessions(this.tilemapManager);
        await this.toolSessionManager.load();
        return Result.Success();
    }

    public async destroy(): Promise<void> {
        await this.tilesetSessionManager.destroy();
        await this.tilemapSessionManager.detroy();
        await this.toolSessionManager.destroy();
    }

    public serialize(): WorkpsaceData {
        return {
            tilesets: this.tilesetSessionManager.serialize(),
            tilemaps: this.tilemapSessionManager.serialize(),
            ruleset: this.rulesetSessionManager.serialize(),
            toolState: this.toolSessionManager.serialize(),
            savedPath: this.savedPathManager.serialize(),
            propertyPanel: this.propertyPanelManager.serialize(),
        }
    }
}

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

const normalizeTilemapSession = (value: unknown): TilemapSessionData | null => {
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

const normalizeTilesetSession = (value: unknown): TilesetSessionData | null => {
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

const normalizeWorkspaceData = (workspaceData: unknown): WorkpsaceData => {
    const data = validate.object<Record<string, unknown>>({ value: workspaceData, defaultValue: defaultWorkspaceData });
    const tilesets = validate.object<Record<string, unknown>>({ value: data.tilesets, defaultValue: {} });
    const tilemaps = validate.object<Record<string, unknown>>({ value: data.tilemaps, defaultValue: {} });
    const ruleset = validate.object<Record<string, unknown>>({ value: data.ruleset, defaultValue: {} });
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
        toolState: {
            currentTool: nullableString(toolState.currentTool),
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
