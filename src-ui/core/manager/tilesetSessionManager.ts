import { Application } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { defaultTilesetSessionData, TilesetSessionData, TilesetSessionManagerData } from "@/shared/schema/tilesetSessionSchema";
import { Result } from "@/shared/types/result";

import { EditorContext } from "../application/editorContext";
import { TilesetSession } from "../application/session/tilesetSession";
import { Tileset } from "../application/tile/tileset";
import { TilesetManager } from "./tilesetManager";
import { ToastService } from "@/shared/services/toastService";

export class TilesetSessionManager {
    public currentTilesetSession: TilesetSession | null = null;
    private tilesetSessionMap: Map<string, TilesetSession> = new Map<string, TilesetSession>();
    private tilesetMap: Map<string, string> = new Map<string, string>();

    private tilesetSessionIdStack: string[] = [];
    
    public get tilesetsSession(): TilesetSession[] {
        return Array.from(this.tilesetSessionMap.values());
    }

    constructor(
        public readonly tilesetSessionManagerData: TilesetSessionManagerData,
        private readonly editorContext: EditorContext
    ) {
        
    }

    public async loadTilesetSessions(tilesetManager: TilesetManager): Promise<void> {
        await Promise.all(this.tilesetSessionManagerData.tilesetSessions.map(async (sessionData) => {
            const tilesetResult = await tilesetManager.loadTileset({ id: sessionData.tilesetId });
            if (tilesetResult.status !== Result.Status.Success) {
                // TODO: Move ToastService outside
                ToastService.error({ message: tilesetResult.message });
                return;
            }
            const tileset = tilesetResult.data;
            const tilesetSession = new TilesetSession(tileset, sessionData);
            this.tilesetSessionMap.set(tilesetSession.id, tilesetSession);
            this.tilesetMap.set(tileset.id, tilesetSession.id);
        }))
    }

    public async unloadAll(): Promise<void> {
        
    }

    public createTilesetSession(tileset: Tileset, pixiApp: Application): TilesetSession | null {
        const sessionId = this.tilesetMap.get(tileset.id);
        if (sessionId) return this.openTilesetSession(sessionId, pixiApp);

        const newTilesetSessionData = defaultTilesetSessionData(tileset.id);

        const newTilesetSession = new TilesetSession(tileset, newTilesetSessionData);
        
        this.tilesetSessionMap.set(newTilesetSession.id, newTilesetSession);
        this.tilesetMap.set(tileset.id, newTilesetSession.id);

        this.openTilesetSession(newTilesetSession.id, pixiApp);

        return newTilesetSession;
    }

    public openTilesetSession(sessionId: string, pixiApp: Application): TilesetSession | null {
        const tilesetSession = this.tilesetSessionMap.get(sessionId);
        if (!tilesetSession) return null;

        if (this.currentTilesetSession) {
            this.currentTilesetSession.sessionView.unActivateSession();
        }
        pixiApp.stage.removeChildren();

        this.currentTilesetSession = tilesetSession;

        this.tilesetSessionIdStack = this.tilesetSessionIdStack.filter(id => id !== sessionId);
        this.tilesetSessionIdStack.push(sessionId);

        tilesetSession.sessionView.activateSession(pixiApp);
        
        return tilesetSession;
    }

    public closeTilesetSession(sessionId: string): void {
        const tilesetSession = this.tilesetSessionMap.get(sessionId);
        if (!tilesetSession) return;

        tilesetSession.destroy();

        this.tilesetSessionMap.delete(sessionId);
        this.tilesetMap.delete(tilesetSession.tileset.id);
        this.tilesetSessionIdStack = this.tilesetSessionIdStack.filter(id => id !== sessionId);

        if (this.currentTilesetSession?.id === sessionId) {
            this.currentTilesetSession = null;
        }
    }

    public getLastTilesetSessionId(): string | null {
        if (this.tilesetSessionIdStack.length === 0) return null;
        return this.tilesetSessionIdStack[this.tilesetSessionIdStack.length - 1] || null;
    }

    public serialize(): TilesetSessionManagerData {
        return {
            tilesetSessions: Array.from(this.tilesetSessionMap.values()).map(session => session.serialize()),
            currentTilesetSessionId: this.currentTilesetSession?.id || null,
        }
    }
}