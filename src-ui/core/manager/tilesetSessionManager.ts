import { v4 as uuidv4 } from "uuid";

import { TilesetSessionData } from "@/shared/schema/session";
import { Result } from "@/shared/types/result";

import { TilesetSession } from "../application/session/tilesetSession";
import { Tileset } from "../application/tile/tileset";

export class TilesetSessionManager {
    public currentTilesetSession: TilesetSession | null = null;
    private tilesetSessionMap: Map<string, TilesetSession> = new Map<string, TilesetSession>(); // sessionId -> session
    private tilesetMap: Map<string, string> = new Map<string, string>(); // tilesetId -> sessionId
    public tilesetsSession(): TilesetSession[] {
        return Array.from(this.tilesetSessionMap.values());
    }

    constructor(sessionData: any) {

    }

    public async createTilesetSession(tileset: Tileset): Promise<Result<TilesetSession>> {
        const sessionId = this.tilesetMap.get(tileset.id);
        if (sessionId) {
            return await this.openTilesetSession(sessionId);
        }

        const newTilesetSessionData: TilesetSessionData = {
            id: uuidv4(),
        }

        const newTilesetSession = new TilesetSession(tileset, newTilesetSessionData);
        
        this.tilesetSessionMap.set(newTilesetSession.id, newTilesetSession);
        this.tilesetMap.set(tileset.id, newTilesetSession.id);

        this.openTilesetSession(newTilesetSession.id);

        return { status: "Success", data: newTilesetSession };
    }

    public async openTilesetSession(sessionId: string): Promise<Result<TilesetSession>> {
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