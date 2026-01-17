import { IWorkspacetorageService } from "@/infrastructure/interface/IWorkspaceStorageService";
import { WorkpsaceData } from "@/shared/schema/workspace";
import { Result } from "@/shared/types/result";

import { TilemapManager } from "../manager/tilemapManager";
import { TilemapSessionManager } from "../manager/tilemapSessionManager";
import { TilesetManager } from "../manager/tilesetManager";
import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { TilemapSession } from "./session/tilemapSession";
import { TilesetSession } from "./session/tilesetSession";
import { Tilemap } from "./tile/tilemap";
import { Tileset } from "./tile/tileset";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    private workspaceStorageService: IWorkspacetorageService;
    private tilesetManager: TilesetManager;
    private tilemapManager: TilemapManager;
    constructor (workspaceData: WorkpsaceData, tilesetManager: TilesetManager, tilemapManager: TilemapManager, workspaceStorageService: IWorkspacetorageService) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets);
        this.tilemapSessionManager = new TilemapSessionManager(workspaceData.tilemaps);
        this.tilesetManager = tilesetManager;
        this.tilemapManager = tilemapManager;
        this.workspaceStorageService = workspaceStorageService;
    }

    public async load(): Promise<Result> {
        await this.tilesetSessionManager.loadAll(this.tilesetManager);
        await this.tilemapSessionManager.loadAll(this.tilemapManager);
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

    public async createTilemapSession(tilemap: Tilemap): Promise<Result<TilemapSession>> {
        const result = await this.tilemapSessionManager.createTilemapSession(tilemap);
        return result;
    }

    public async openTilemapSession(sessionId: string): Promise<Result<TilemapSession>> {
        const result = await this.tilemapSessionManager.openTilemapSession(sessionId);
        return result;
    }

    public async closeTilemapSession(sessionId: string): Promise<Result> {
        const result = await this.tilemapSessionManager.closeTilemapSession(sessionId);
        return result;
    }

    public async save(): Promise<Result> {
        const workspaceData = this.serialize();
        // console.log("Save workspace");
        return await this.workspaceStorageService.saveWorkspace(workspaceData);
    }

    public serialize(): WorkpsaceData {
        return {
            tilesets: this.tilesetSessionManager.serialize(),
            tilemaps: this.tilemapSessionManager.serialize(),
        }
    }
}