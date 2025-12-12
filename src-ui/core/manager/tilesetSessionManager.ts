import { v4 as uuidv4 } from "uuid";

import { TilesetViewSessionData } from "@/shared/schema/session";
import { Result } from "@/shared/types/result";

import { AppCore } from "../appcore";
import { TilesetViewSession } from "../application/session/tilesetViewSession";

export class TilesetSessionManager {
    public currentTilesetSession: TilesetViewSession | null = null;
    private tilesetSessionMap: Map<string, TilesetViewSession> = new Map<string, TilesetViewSession>(); // sessionId -> session
    private tilesetMap: Map<string, string> = new Map<string, string>(); // tilesetId -> sessionId
    public tilesetsSession(): TilesetViewSession[] {
        return Array.from(this.tilesetSessionMap.values());
    }

    constructor(sessionData: any) {

    }

    public async createTilesetViewSession(tilesetId: string): Promise<Result<TilesetViewSession>> {
        const sessionId = this.tilesetMap.get(tilesetId);
        if (sessionId) {
            return await this.openTilesetViewSession(sessionId);
        }

        const result = AppCore.getCurrentProject().tilesetManager.getTilesetById(tilesetId);
        if (result.status !== "Success" || !result.data) {
            console.error("Tileset not found");
            return { status: "Error", message: "Tileset not found" };
        }

        const newTilesetSessionData: TilesetViewSessionData = {
            id: uuidv4(),
        }

        const newTilesetSession = new TilesetViewSession(result.data, newTilesetSessionData);
        
        this.tilesetSessionMap.set(newTilesetSession.id, newTilesetSession);
        this.tilesetMap.set(tilesetId, newTilesetSession.id);

        this.openTilesetViewSession(newTilesetSession.id);

        return { status: "Success", data: newTilesetSession };
    }

    public async openTilesetViewSession(sessionId: string): Promise<Result<TilesetViewSession>> {
        const tilesetSession = this.tilesetSessionMap.get(sessionId);
        if (!tilesetSession) return { status: "Error", message: "Tileset session not found" };
        this.currentTilesetSession = tilesetSession;
        return { status: "Success", data: tilesetSession };
    }

    public async removeSession(tilesetId: string): Promise<Result<string>> {
        if (!this.tilesetMap.has(tilesetId)) {
            console.error("Tileset not found");
            return { status: "Error", message: "Tileset not found" };
        }
        const sessionId = this.tilesetMap.get(tilesetId);
        this.tilesetMap.delete(tilesetId);
        if (!sessionId) return { status: "Error", message: "Tileset session not found" };
        this.tilesetSessionMap.delete(sessionId);
        return { status: "Success", data: sessionId };
    }
}