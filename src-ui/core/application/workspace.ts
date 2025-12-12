import { Result } from "@/shared/types/result";

import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { TilesetSession } from "./session/tilesetSession";
import { Tileset } from "./tile/tileset";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    constructor (workspaceData: any) {
        this.tilesetSessionManager = new TilesetSessionManager(null);
    }

    public async createTilesetSession(tileset: Tileset): Promise<Result<TilesetSession>> {
        return await this.tilesetSessionManager.createTilesetSession(tileset);
    }

    public async openTilesetSession(sessionId: string): Promise<Result<TilesetSession>> {
        return await this.tilesetSessionManager.openTilesetSession(sessionId);
    }
}