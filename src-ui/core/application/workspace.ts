import { IWorkspacetorageService } from "@/infrastructure/interface/IWorkspaceStorageService";
import { WorkpsaceData } from "@/shared/schema/workspace";
import { Result } from "@/shared/types/result";

import { TilemapManager } from "../manager/tilemapManager";
import { TilemapSessionManager } from "../manager/tilemapSessionManager";
import { TilesetManager } from "../manager/tilesetManager";
import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { ToolSessionManager } from "../manager/toolSessionManager";
import { EditorContext } from "./editorContext";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    public toolSessionManager: ToolSessionManager;

    constructor (
        workspaceData: WorkpsaceData, 
        private readonly tilesetManager: TilesetManager, 
        private readonly tilemapManager: TilemapManager,
        private readonly workspaceStorageService: IWorkspacetorageService,
        private readonly editorContext: EditorContext,
    ) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets, this.editorContext);
        this.tilemapSessionManager = new TilemapSessionManager(workspaceData.tilemaps, this.editorContext);
        this.toolSessionManager = new ToolSessionManager(workspaceData.toolState, this.editorContext);
    }

    public async load(): Promise<Result> {
        await this.tilesetSessionManager.loadAll(this.tilesetManager);
        await this.tilemapSessionManager.loadAll(this.tilemapManager);
        await this.toolSessionManager.load();
        return { status: "Success", data: null };
    }

    public async unload(): Promise<void> {
        await this.tilesetSessionManager.unloadAll();
        await this.tilemapSessionManager.unloadAll();
        await this.toolSessionManager.unload();
    }

    public async save(): Promise<Result> {
        const workspaceData = this.serialize();
        return await this.workspaceStorageService.saveWorkspace(workspaceData);
    }

    public serialize(): WorkpsaceData {
        return {
            tilesets: this.tilesetSessionManager.serialize(),
            tilemaps: this.tilemapSessionManager.serialize(),
            toolState: this.toolSessionManager.serialize(),
        }
    }
}