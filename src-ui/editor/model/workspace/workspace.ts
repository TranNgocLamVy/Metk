import { WorkpsaceData } from "@/shared/data-types/workspace.data";
import { Result } from "@/shared/types/result";

import { WorkspaceSavedPathManager } from "@/application/workspace/workspace-saved-path.manager";
import { TilemapManager } from "@/application/resources/tilemap/tilemap.manager";
import { TilemapSessionManager } from "@/application/workspace/session/tilemap-session.manager";
import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { TilesetSessionManager } from "@/application/workspace/session/tileset-session.manager";
import { EditorFacade } from "@/application/editor.facade";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { RulesetSessionManager } from "@/application/workspace/session/ruleset-session.manager";
import { EntityCollectionSessionManager } from "@/application/workspace/session/entity-collection-session.manager";
import { ToolSessionManager } from "@/application/workspace/session/tool-session.manager";
import { WorkspacePropertyPanelManager } from "@/application/workspace/workspace-property-panel.manager";
import { normalizeWorkspaceData } from "./workspace.normalizer";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    public rulesetSessionManager: RulesetSessionManager;
    public entityCollectionSessionManager: EntityCollectionSessionManager;
    public toolSessionManager: ToolSessionManager;
    public savedPathManager: WorkspaceSavedPathManager;
    public propertyPanelManager: WorkspacePropertyPanelManager;
    public constructor (
        data: WorkpsaceData,
        private readonly tilesetManager: TilesetManager, 
        private readonly tilemapManager: TilemapManager,
        public readonly projectPathSystem: ProjectPathSystem,
        private readonly editorFacade: EditorFacade,
    ) {
        this.tilesetSessionManager = new TilesetSessionManager(data.tilesets, this.editorFacade);
        this.tilemapSessionManager = new TilemapSessionManager(data.tilemaps, this.editorFacade);
        this.rulesetSessionManager = new RulesetSessionManager(data.ruleset, this.editorFacade);
        this.entityCollectionSessionManager = new EntityCollectionSessionManager(data.entityCollection, this.editorFacade);
        this.toolSessionManager = new ToolSessionManager(data.toolState, this.editorFacade);
        this.savedPathManager = new WorkspaceSavedPathManager(data.savedPath, this.projectPathSystem);
        this.propertyPanelManager = new WorkspacePropertyPanelManager(data.propertyPanel, this.editorFacade);
    }

    public static createFromFileData(workspaceData: unknown,tilesetManager: TilesetManager,tilemapManager: TilemapManager,projectPathSystem: ProjectPathSystem,editorFacade: EditorFacade): Result<Workspace> {
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
            entityCollection: this.entityCollectionSessionManager.serialize(),
            toolState: this.toolSessionManager.serialize(),
            savedPath: this.savedPathManager.serialize(),
            propertyPanel: this.propertyPanelManager.serialize(),
        }
    }
}

