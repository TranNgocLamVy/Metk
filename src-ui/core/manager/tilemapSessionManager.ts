import { Application } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { TilemapSessionData, TilemapSessionManagerData } from "@/shared/schema/tilemapSession";
import { Result } from "@/shared/types/result";

import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { Tilemap } from "../application/tile/tilemap";
import { TilemapManager } from "./tilemapManager";

export class TilemapSessionManager {
    public currentTilemapSession: TilemapSession | null = null;
    private tilemapSessionMap: Map<string, TilemapSession> = new Map<string, TilemapSession>(); // sessionId -> session
    private tilemapMap: Map<string, string> = new Map<string, string>(); // tilemapId -> sessionId

    private tilemapSessionIdStack: string[] = [];

    public get tilemapsSession(): TilemapSession[] {
        return Array.from(this.tilemapSessionMap.values());
    }

    constructor(
        public readonly tilemapSessionManagerData: TilemapSessionManagerData,
        private readonly editorContext: EditorContext
    ) {
        
    }

    public async loadAll(tilemapManager: TilemapManager): Promise<void> {
        this.tilemapSessionManagerData.tilemapSessions.forEach(sessionData => {
            const tilemapResult = tilemapManager.getTilemapById(sessionData.tilemapId);
            if (tilemapResult.status !== "Success" || !tilemapResult.data) {
                console.error(tilemapResult.message);
                return;
            }
            const tilemap = tilemapResult.data;
            const tilemapSession = new TilemapSession(tilemap, sessionData, this.editorContext);
            this.tilemapSessionMap.set(tilemapSession.id, tilemapSession);
            this.tilemapMap.set(tilemap.id, tilemapSession.id);
        });
    }

    public async createTilemapSession(tilemap: Tilemap, pixiApp: Application): Promise<Result<TilemapSession>> {
        const sessionId = this.tilemapMap.get(tilemap.id);
        if (sessionId) {
            return await this.openTilemapSession(sessionId, pixiApp);
        }

        const newTilemapSessionData: TilemapSessionData = {
            id: uuidv4(),
            tilemapId: tilemap.id,
            viewState: { x: null, y: null, zoom: 1 },
            layerState: { selectedLayers: [] },
        }

        const newTilemapSession = new TilemapSession(tilemap, newTilemapSessionData, this.editorContext);
        
        this.tilemapSessionMap.set(newTilemapSession.id, newTilemapSession);
        this.tilemapMap.set(tilemap.id, newTilemapSession.id);

        this.openTilemapSession(newTilemapSession.id, pixiApp);

        return { status: "Success", data: newTilemapSession };
    }

    public async openTilemapSession(sessionId: string, pixiApp: Application): Promise<Result<TilemapSession>> {
        const tilemapSession = this.tilemapSessionMap.get(sessionId);
        if (!tilemapSession) return { status: "Error", message: "Tilemap session not found" };

        if (this.currentTilemapSession) {
            this.currentTilemapSession.sessionView.unActivateSession();
        }

        this.currentTilemapSession = tilemapSession;
        
        this.tilemapSessionIdStack = this.tilemapSessionIdStack.filter(id => id !== sessionId);
        this.tilemapSessionIdStack.push(sessionId);
        
        tilemapSession.sessionView.activateSession(pixiApp);

        return { status: "Success", data: tilemapSession };
    }

    public async closeTilemapSession(sessionId: string): Promise<Result<string>> {
        const tilemapSession = this.tilemapSessionMap.get(sessionId);
        if (!tilemapSession) return { status: "Error", message: "Tilemap session not found" };

        tilemapSession.sessionView.unActivateSession();
        tilemapSession.sessionView.destroy();

        this.tilemapSessionMap.delete(sessionId);
        this.tilemapMap.delete(tilemapSession.tilemap.id);
        this.tilemapSessionIdStack = this.tilemapSessionIdStack.filter(id => id !== sessionId);
        
        if (this.currentTilemapSession?.id === sessionId) {
            this.currentTilemapSession = null;
        }
        return { status: "Success", data: sessionId };
    }

    public getLastTilemapSessionId(): string | null {
        if (this.tilemapSessionIdStack.length === 0) return null;
        return this.tilemapSessionIdStack[this.tilemapSessionIdStack.length - 1] || null; 
    }

    public serialize(): TilemapSessionManagerData {
        return {
            tilemapSessions: Array.from(this.tilemapSessionMap.values()).map(session => session.serialize()),
            currentTilemapSessionId: this.currentTilemapSession?.id || null,
        }
    }
}