import { Result } from "@/shared/types/result";

import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { TilesetViewSession } from "./session/tilesetViewSession";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    constructor (workspaceData: any) {
        this.tilesetSessionManager = new TilesetSessionManager(null);
    }

    public async createTilesetViewSession(tilesetId: string): Promise<Result<TilesetViewSession>> {
        return await this.tilesetSessionManager.createTilesetViewSession(tilesetId);
    }

    public async openTilesetViewSession(sessionId: string): Promise<Result<TilesetViewSession>> {
        return await this.tilesetSessionManager.openTilesetViewSession(sessionId);
    }
}