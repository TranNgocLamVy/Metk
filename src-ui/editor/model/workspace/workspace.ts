import { WorkpsaceData } from "@/shared/schema/workspaceSchema";
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

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    public rulesetSessionManager: RulesetSessionManager;
    public toolSessionManager: ToolSessionManager;
    public savedPathManager: WorkspaceSavedPathManager;
    public propertyPanelManager: WorkspacePropertyPanelManager;
    constructor (
        workspaceData: WorkpsaceData, 
        private readonly tilesetManager: TilesetManager, 
        private readonly tilemapManager: TilemapManager,
        public readonly projectPathSystem: ProjectPathSystem,
        private readonly editorFacade: EditorFacade,
    ) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets, this.editorFacade);
        this.tilemapSessionManager = new TilemapSessionManager(workspaceData.tilemaps, this.editorFacade);
        this.rulesetSessionManager = new RulesetSessionManager(workspaceData.ruleset, this.editorFacade);
        this.toolSessionManager = new ToolSessionManager(workspaceData.toolState, this.editorFacade);
        this.savedPathManager = new WorkspaceSavedPathManager(workspaceData.savedPath, this.projectPathSystem);
        this.propertyPanelManager = new WorkspacePropertyPanelManager(workspaceData.propertyPanel, this.editorFacade);
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