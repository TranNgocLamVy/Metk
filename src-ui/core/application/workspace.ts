import { IWorkspacetorageService } from "@/infrastructure/interface/IWorkspaceStorageService";
import { WorkpsaceData } from "@/shared/schema/workspace";
import { Result } from "@/shared/types/result";

import { TilesetManager } from "../manager/tilesetManager";
import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { TilesetSession } from "./session/tilesetSession";
import { Tileset } from "./tile/tileset";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    private workspaceStorageService: IWorkspacetorageService;
    private tilesetManager: TilesetManager;
    constructor (workspaceData: WorkpsaceData, tilesetManager: TilesetManager, workspaceStorageService: IWorkspacetorageService) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets);
        this.tilesetManager = tilesetManager;
        this.workspaceStorageService = workspaceStorageService;
    }

    public async load(): Promise<Result> {
        await this.tilesetSessionManager.loadAll(this.tilesetManager);
        return { status: "Success", data: null };
    }

    public async createTilesetSession(tileset: Tileset): Promise<Result<TilesetSession>> {
        const result = await this.tilesetSessionManager.createTilesetSession(tileset);
        return result;
    }

    public async openTilesetSession(sessionId: string): Promise<Result<TilesetSession>> {
        const result = await this.tilesetSessionManager.openTilesetSession(sessionId);
        return await this.tilesetSessionManager.openTilesetSession(sessionId);
    }

    public async closeTilesetSession(sessionId: string): Promise<Result> {
        const result = await this.tilesetSessionManager.closeTilesetSession(sessionId);
        return result;
    }

    public async save(): Promise<Result> {
        const workspaceData = this.serialize();
        console.log("Save workspace");
        return await this.workspaceStorageService.saveWorkspace(workspaceData);
    }

    public serialize(): WorkpsaceData {
        return {
            tilesets: this.tilesetSessionManager.serialize(),
        }
    }
}