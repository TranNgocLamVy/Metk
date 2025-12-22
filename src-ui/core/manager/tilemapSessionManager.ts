import { v4 as uuidv4 } from "uuid";

import { TilemapSessionData, TilemapSessionManagerData } from "@/shared/schema/tilemapSession";
import { Result } from "@/shared/types/result";

import { TilemapSession } from "../application/session/tilemapSession";
import { Tilemap } from "../application/tile/tilemap";
import { TilemapManager } from "./tilemapManager";

export class TilemapSessionManager {
    public currentTilemapSession: TilemapSession | null = null;
    private tilemapSessionMap: Map<string, TilemapSession> = new Map<string, TilemapSession>(); // sessionId -> session
    private tilemapMap: Map<string, string> = new Map<string, string>(); // tilemapId -> sessionId
    public get tilemapsSession(): TilemapSession[] {
        return Array.from(this.tilemapSessionMap.values());
    }

    constructor(private readonly tilemapSessionManagerData: TilemapSessionManagerData) {
        
    }

    public async loadAll(tilemapManager: TilemapManager): Promise<void> {
        this.tilemapSessionManagerData.tilemapSessions.forEach(sessionData => {
            const tilemapResult = tilemapManager.getTilemapById(sessionData.tilemapId);
            if (tilemapResult.status !== "Success" || !tilemapResult.data) {
                console.error(tilemapResult.message);
                return;
            }
            const tilemap = tilemapResult.data;
            const tilemapSession = new TilemapSession(tilemap, sessionData);
            this.tilemapSessionMap.set(tilemapSession.id, tilemapSession);
            this.tilemapMap.set(tilemap.id, tilemapSession.id);
        });

        if (this.tilemapSessionManagerData.currentTilemapSessionId) {
            this.openTilemapSession(this.tilemapSessionManagerData.currentTilemapSessionId);
        }
    }

    public async createTilemapSession(tilemap: Tilemap): Promise<Result<TilemapSession>> {
        const sessionId = this.tilemapMap.get(tilemap.id);
        if (sessionId) {
            return await this.openTilemapSession(sessionId);
        }

        const newTilemapSessionData: TilemapSessionData = {
            id: uuidv4(),
            tilemapId: tilemap.id,
            viewState: { x: null, y: null, zoom: 1 },
        }

        const newTilemapSession = new TilemapSession(tilemap, newTilemapSessionData);
        
        this.tilemapSessionMap.set(newTilemapSession.id, newTilemapSession);
        this.tilemapMap.set(tilemap.id, newTilemapSession.id);

        this.openTilemapSession(newTilemapSession.id);

        return { status: "Success", data: newTilemapSession };
    }

    public async openTilemapSession(sessionId: string): Promise<Result<TilemapSession>> {
        const tilemapSession = this.tilemapSessionMap.get(sessionId);
        if (!tilemapSession) return { status: "Error", message: "Tilemap session not found" };
        this.currentTilemapSession = tilemapSession;
        return { status: "Success", data: tilemapSession };
    }

    public async closeTilemapSession(sessionId: string): Promise<Result<string>> {
        const tilemapSession = this.tilemapSessionMap.get(sessionId);
        if (!tilemapSession) return { status: "Error", message: "Tilemap session not found" };
        this.tilemapSessionMap.delete(sessionId);
        this.tilemapMap.delete(tilemapSession.tilemap.id);
        return { status: "Success", data: sessionId };
    }

    public serialize(): TilemapSessionManagerData {
        return {
            tilemapSessions: Array.from(this.tilemapSessionMap.values()).map(session => session.serialize()),
            currentTilemapSessionId: this.currentTilemapSession?.id || null,
        }
    }
}