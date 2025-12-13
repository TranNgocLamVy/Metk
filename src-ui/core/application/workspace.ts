import { WorkpsaceData } from "@/shared/schema/workspace";
import { Result } from "@/shared/types/result";

import { TilesetManager } from "../manager/tilesetManager";
import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { TilesetSession } from "./session/tilesetSession";
import { Tileset } from "./tile/tileset";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    private tilesetManager: TilesetManager;
    constructor (workspaceData: WorkpsaceData, tilesetManager: TilesetManager) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets);
        this.tilesetManager = tilesetManager;
    }

    public async load(): Promise<Result> {
        await this.tilesetSessionManager.loadAll(this.tilesetManager);
        return { status: "Success", data: null };
    }

    public async createTilesetSession(tileset: Tileset): Promise<Result<TilesetSession>> {
        return await this.tilesetSessionManager.createTilesetSession(tileset);
    }

    public async openTilesetSession(sessionId: string): Promise<Result<TilesetSession>> {
        return await this.tilesetSessionManager.openTilesetSession(sessionId);
    }

    public serialize(): WorkpsaceData {
        return {
            tilesets: this.tilesetSessionManager.serialize(),
        }
    }
}