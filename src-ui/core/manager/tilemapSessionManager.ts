import { Application } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { defaultTilemapSessionData, TilemapSessionData, TilemapSessionManagerData } from "@/shared/schema/tilemapSessionSchema";

import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { Tilemap } from "../application/tile/tilemap";
import { TilemapManager } from "./tilemapManager";
import { Result } from "@/shared/types/result";
import { ToastService } from "@/shared/services/toastService";

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

    public async loadTilemapSessions(tilemapManager: TilemapManager): Promise<Result> {
        await Promise.all(this.tilemapSessionManagerData.tilemapSessions.map(async (sessionData) => {
            const tilemapResult = await tilemapManager.loadTilemap(sessionData.tilemapId);
            if (tilemapResult.status !== Result.Status.Success) {
                // TODO: Move ToastService outside
                return Result.Error(tilemapResult.message);     
            }
            const tilemap = tilemapResult.data;
            const tilemapSession = new TilemapSession(tilemap, sessionData, this.editorContext);
            await tilemapSession.loadTilemapSession();

            this.tilemapSessionMap.set(tilemapSession.id, tilemapSession);
            this.tilemapMap.set(tilemap.id, tilemapSession.id);
        }))
        return Result.Success();
    }

    public async detroy(): Promise<void> {
        Array.from(this.tilemapSessionMap.values()).forEach(session => session.destroy());
        this.tilemapSessionMap.clear();
        this.tilemapMap.clear();
    }

    public async createTilemapSession(tilemap: Tilemap, pixiApp: Application): Promise<TilemapSession | null> {
        const sessionId = this.tilemapMap.get(tilemap.id);
        if (sessionId) return this.openTilemapSession(sessionId, pixiApp);

        const newTilemapSessionData = defaultTilemapSessionData(tilemap.id);

        const newTilemapSession = new TilemapSession(tilemap, newTilemapSessionData, this.editorContext);
        await newTilemapSession.loadTilemapSession();
        
        this.tilemapSessionMap.set(newTilemapSession.id, newTilemapSession);
        this.tilemapMap.set(tilemap.id, newTilemapSession.id);

        return this.openTilemapSession(newTilemapSession.id, pixiApp);
    }

    public openTilemapSession(sessionId: string, pixiApp: Application): TilemapSession | null {
        const tilemapSession = this.tilemapSessionMap.get(sessionId);
        if (!tilemapSession) return null;

        if (this.currentTilemapSession) {
            this.currentTilemapSession.sessionView.unActivateSession();
        }

        this.currentTilemapSession = tilemapSession;
        
        this.tilemapSessionIdStack = this.tilemapSessionIdStack.filter(id => id !== sessionId);
        this.tilemapSessionIdStack.push(sessionId);
        
        tilemapSession.sessionView.activateSession(pixiApp);
        this.editorContext.eventEmitter.emit("onOpenTilemapSession");
        
        return tilemapSession;
    }

    public closeTilemapSession(sessionId: string): void {
        const tilemapSession = this.tilemapSessionMap.get(sessionId);
        if (!tilemapSession) return;

        tilemapSession.destroy();

        this.tilemapSessionMap.delete(sessionId);
        this.tilemapMap.delete(tilemapSession.tilemap.id);
        this.tilemapSessionIdStack = this.tilemapSessionIdStack.filter(id => id !== sessionId);

        const currentProject = this.editorContext.currentProject;
        if (!currentProject) return;

        const tilemapManager = currentProject.tilemapManager;
        tilemapManager.unloadTilemap(tilemapSession.tilemap.id);
        
        if (this.currentTilemapSession?.id === sessionId) {
            this.currentTilemapSession = null;
        }
    }

    public getSession(sessionId: string): TilemapSession | null {
        return this.tilemapSessionMap.get(sessionId) || null;
    }

    public getSessionByTilemapId(tilemapId: string): TilemapSession | null {
        const sessionId = this.tilemapMap.get(tilemapId);
        if (!sessionId) return null;
        return this.tilemapSessionMap.get(sessionId) || null;
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