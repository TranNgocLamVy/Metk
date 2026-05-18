import { WorkpsaceData } from "@/shared/schema/workspaceSchema";
import { Result } from "@/shared/types/result";

import { WorkspaceSavedPathManager } from "@/application/workspace/workspace-saved-path.manager";
import { TilemapManager } from "@/application/resources/tilemap/tilemap.manager";
import { TilemapSessionManager } from "@/application/workspace/session/tilemap-session.manager";
import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { TilesetSessionManager } from "@/application/workspace/session/tileset-session.manager";
import { EditorFacade } from "@/application/editor.facade";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { RulesetSessionManager } from "@/application/workspace/session/ruleset-session.manager";
import { ToolSessionManager } from "@/application/workspace/session/tool-session.manager";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    public rulesetSessionManager: RulesetSessionManager;
    public toolSessionManager: ToolSessionManager;
    public savedPathManager: WorkspaceSavedPathManager;

    constructor (
        workspaceData: WorkpsaceData, 
        private readonly tilesetManager: TilesetManager, 
        private readonly tilemapManager: TilemapManager,
        public readonly projectPathSystem: ProjectPathSystem,
        private readonly editorContext: EditorFacade,
    ) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets, this.editorContext);
        this.tilemapSessionManager = new TilemapSessionManager(workspaceData.tilemaps, this.editorContext);
        this.rulesetSessionManager = new RulesetSessionManager(workspaceData.ruleset, this.editorContext);
        this.toolSessionManager = new ToolSessionManager(workspaceData.toolState, this.editorContext);
        this.savedPathManager = new WorkspaceSavedPathManager(workspaceData.savedPath, this.projectPathSystem);
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
        }
    }
}