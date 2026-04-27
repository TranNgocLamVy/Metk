import { EventEmitter } from "eventemitter3";
import { defaultTilemapSessionData, TilemapSessionManagerData } from "@/shared/schema/tilemapSessionSchema";
import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { Tilemap } from "../application/tile/tilemap";
import { TilemapManager } from "./tilemapManager";
import { Result } from "@/shared/types/result";
import { Console } from "@/shared/services/consoleService";
import { CatchError } from "../decorator/catchResultError";
import { TilemapSessionView } from "../application/session/tilemapSessionView";

export type TilemapSessionManagerEvent = {
    onCreateTilemapSession: (session: TilemapSession) => void;
    onOpenTilemapSession: (session: TilemapSession) => void;
    onCloseTilemapSession: (sessionId: string) => void;
}

export class TilemapSessionManager extends EventEmitter<TilemapSessionManagerEvent> {
    public currentTilemapSession: TilemapSession | null = null;
    private tilemapSessionMap: Map<string, TilemapSession> = new Map<string, TilemapSession>(); // sessionId -> session
    private tilemapMap: Map<string, string> = new Map<string, string>(); // tilemapId -> sessionId

    private currentTilemapSessionView: TilemapSessionView | null = null;

    public get tilemapsSession(): TilemapSession[] {
        return Array.from(this.tilemapSessionMap.values());
    }

    constructor(
        public readonly tilemapSessionManagerData: TilemapSessionManagerData,
        private readonly editorContext: EditorContext
    ) {
        super();
    }

    @CatchError("message.system.unknownError.loadTilemapSession")
    public async loadTilemapSessions(tilemapManager: TilemapManager): Promise<Result> {
        await Promise.all(this.tilemapSessionManagerData.tilemapSessions.map(async (sessionData) => {
            const tilemapResult = await tilemapManager.loadTilemap(sessionData.tilemapId);
            if (tilemapResult.status !== Result.Status.Success) return Result.Error(tilemapResult.message); 
            const tilemap = tilemapResult.data;
            const tilemapSession = new TilemapSession(tilemap, sessionData, this.editorContext);
            await tilemapSession.loadTilemapSession();

            this.tilemapSessionMap.set(tilemapSession.id, tilemapSession);
            this.tilemapMap.set(tilemap.id, tilemapSession.id);
        }))

        if (this.tilemapSessionManagerData.currentTilemapSessionId) {
            const activeSession = this.tilemapSessionMap.get(this.tilemapSessionManagerData.currentTilemapSessionId);
            if (activeSession) this.openTilemapSession(activeSession.id);
        }

        return Result.Success();
    }

    public async detroy(): Promise<void> {
        Array.from(this.tilemapSessionMap.values()).forEach(session => session.destroy());
        this.tilemapSessionMap.clear();
        this.tilemapMap.clear();
        this.removeAllListeners();
    }

    public async createTilemapSession(tilemap: Tilemap): Promise<TilemapSession | null> {
        const sessionId = this.tilemapMap.get(tilemap.id);
        if (sessionId) return this.openTilemapSession(sessionId);

        const newTilemapSessionData = defaultTilemapSessionData(tilemap.id);

        const newTilemapSession = new TilemapSession(tilemap, newTilemapSessionData, this.editorContext);
        await newTilemapSession.loadTilemapSession();
        
        this.tilemapSessionMap.set(newTilemapSession.id, newTilemapSession);
        this.tilemapMap.set(tilemap.id, newTilemapSession.id);
        
        this.emit("onCreateTilemapSession", newTilemapSession);

        Console.log({ message: { key: "message.tilemap.openSuccess", options: { name: newTilemapSession.tilemap.name }}});

        return this.openTilemapSession(newTilemapSession.id);
    }

    public openTilemapSession(sessionId: string): TilemapSession | null {
        const tilemapSession = this.tilemapSessionMap.get(sessionId);
        if (!tilemapSession) return null;

        this.currentTilemapSession = tilemapSession;
        
        this.emit("onOpenTilemapSession", tilemapSession);

        return tilemapSession;
    }

    public closeTilemapSession(sessionId: string): void {
        const tilemapSession = this.tilemapSessionMap.get(sessionId);
        if (!tilemapSession) return;

        tilemapSession.destroy();

        this.tilemapSessionMap.delete(sessionId);
        this.tilemapMap.delete(tilemapSession.tilemap.id);
        
        const currentProject = this.editorContext.currentProject;
        if (!currentProject) return;

        const tilemapManager = currentProject.tilemapManager;
        tilemapManager.unloadTilemap(tilemapSession.tilemap.id);
        
        if (this.currentTilemapSession?.id === sessionId) {
            this.currentTilemapSession = null;
        }
        this.emit("onCloseTilemapSession", sessionId);

        Console.log({ message: { key: "message.tilemap.closeSuccess", options: { name: tilemapSession.tilemap.name } }})
    }

    public getSession(sessionId: string): TilemapSession | null {
        return this.tilemapSessionMap.get(sessionId) || null;
    }

    public getSessionByTilemapId(tilemapId: string): TilemapSession | null {
        const sessionId = this.tilemapMap.get(tilemapId);
        if (!sessionId) return null;
        return this.tilemapSessionMap.get(sessionId) || null;
    }

    public getCurrentSessionView(): TilemapSessionView | null {
        return this.currentTilemapSessionView;
    }

    public registerView(view: TilemapSessionView | null) {
        this.currentTilemapSessionView = view
    }

    public unregisterView() {
        this.currentTilemapSessionView = null;
    }

    public serialize(): TilemapSessionManagerData {
        return {
            tilemapSessions: Array.from(this.tilemapSessionMap.values()).map(session => session.serialize()),
            currentTilemapSessionId: this.currentTilemapSession?.id || null,
        }
    }
}