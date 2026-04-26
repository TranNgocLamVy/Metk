import { WorkpsaceData } from "@/shared/schema/workspaceSchema";
import { Result } from "@/shared/types/result";

import { SavedPathManager } from "../manager/savedPathManager";
import { TilemapManager } from "../manager/tilemapManager";
import { TilemapSessionManager } from "../manager/tilemapSessionManager";
import { TilesetManager } from "../manager/tilesetManager";
import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { ToolSessionManager } from "../manager/toolSessionManager";
import { EditorContext } from "./editorContext";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { RulesetSessionManager } from "../manager/rulesetSessionManager";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    public rulesetSessionManager: RulesetSessionManager;
    public toolSessionManager: ToolSessionManager;
    public savedPathManager: SavedPathManager;

    constructor (
        workspaceData: WorkpsaceData, 
        private readonly tilesetManager: TilesetManager, 
        private readonly tilemapManager: TilemapManager,
        public readonly projectPathSystem: ProjectPathSystem,
        private readonly editorContext: EditorContext,
    ) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets, this.editorContext);
        this.tilemapSessionManager = new TilemapSessionManager(workspaceData.tilemaps, this.editorContext);
        this.rulesetSessionManager = new RulesetSessionManager(workspaceData.ruleset, this.editorContext);
        this.toolSessionManager = new ToolSessionManager(workspaceData.toolState, this.editorContext);
        this.savedPathManager = new SavedPathManager(workspaceData.savedPath, this.projectPathSystem);
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