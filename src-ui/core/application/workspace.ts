import { WorkpsaceData } from "@/shared/schema/workspaceSchema";
import { Result } from "@/shared/types/result";

import { ExportPathManager } from "../manager/exportPathManager";
import { TilemapManager } from "../manager/tilemapManager";
import { TilemapSessionManager } from "../manager/tilemapSessionManager";
import { TilesetManager } from "../manager/tilesetManager";
import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { ToolSessionManager } from "../manager/toolSessionManager";
import { EditorContext } from "./editorContext";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    public toolSessionManager: ToolSessionManager;
    public exportPathManager: ExportPathManager;

    constructor (
        workspaceData: WorkpsaceData, 
        private readonly tilesetManager: TilesetManager, 
        private readonly tilemapManager: TilemapManager,
        public readonly projectPathSystem: ProjectPathSystem,
        private readonly editorContext: EditorContext,
    ) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets, this.editorContext);
        this.tilemapSessionManager = new TilemapSessionManager(workspaceData.tilemaps, this.editorContext);
        this.toolSessionManager = new ToolSessionManager(workspaceData.toolState, this.editorContext);
        this.exportPathManager = new ExportPathManager(workspaceData.exportPaths ?? []);
    }

    public async load(): Promise<Result> {
        await this.tilesetSessionManager.loadAll(this.tilesetManager);
        await this.tilemapSessionManager.loadAll(this.tilemapManager);
        await this.toolSessionManager.load();
        return Result.Success();
    }

    public async unload(): Promise<void> {
        await this.tilesetSessionManager.unloadAll();
        await this.tilemapSessionManager.unloadAll();
        await this.toolSessionManager.unload();
    }

    public serialize(): WorkpsaceData {
        return {
            tilesets: this.tilesetSessionManager.serialize(),
            tilemaps: this.tilemapSessionManager.serialize(),
            toolState: this.toolSessionManager.serialize(),
            exportPaths: this.exportPathManager.serialize(),
        }
    }
}