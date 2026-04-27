import { EventEmitter } from "eventemitter3";
import { defaultTilesetSessionData, TilesetSessionManagerData } from "@/shared/schema/tilesetSessionSchema";
import { Result } from "@/shared/types/result";
import { EditorContext } from "../application/editorContext";
import { TilesetSession } from "../application/session/tilesetSession";
import { Tileset } from "../application/tile/tileset";
import { TilesetManager } from "./tilesetManager";
import { Console } from "@/shared/services/consoleService";
import { CatchError } from "../decorator/catchResultError";
import { TilesetSessionView } from "../application/session/tilesetSessionView";

export type TilesetSessionManagerEvent = {
    onCreateTilesetSession: (session: TilesetSession) => void;
    onOpenTilesetSession: (session: TilesetSession) => void;
    onCloseTilesetSession: (sessionId: string) => void;
}

export class TilesetSessionManager extends EventEmitter<TilesetSessionManagerEvent> {
    private tilesetSessionMap: Map<string, TilesetSession> = new Map<string, TilesetSession>();
    private tilesetMap: Map<string, string> = new Map<string, string>();

    public activeSession: TilesetSession | null = null;
    private activeSessionView: TilesetSessionView | null = null;

    private tilesetSessionIdStack: string[] = [];

    public get tilesetsSession(): TilesetSession[] {
        return Array.from(this.tilesetSessionMap.values());
    }

    constructor(
        public readonly tilesetSessionManagerData: TilesetSessionManagerData,
        private readonly editorContext: EditorContext
    ) {
        super();
    }

    @CatchError("message.system.unknownError.loadTilesetSession")
    public async loadTilesetSessions(tilesetManager: TilesetManager): Promise<Result> {
        await Promise.all(this.tilesetSessionManagerData.tilesetSessions.map(async (sessionData) => {
            const tilesetResult = await tilesetManager.loadTileset(sessionData.tilesetId);
            if (tilesetResult.status !== Result.Status.Success) {
                return Result.Error(tilesetResult.message);
            }
            const tileset = tilesetResult.data;
            const tilesetSession = new TilesetSession(tileset, sessionData, this.editorContext);
            await tilesetSession.loadTilesetSession();

            this.tilesetSessionMap.set(tilesetSession.id, tilesetSession);
            this.tilesetMap.set(tileset.id, tilesetSession.id);
        }))
        return Result.Success();
    }

    public async createTilesetSession(tileset: Tileset): Promise<TilesetSession | null> {
        const sessionId = this.tilesetMap.get(tileset.id);
        if (sessionId) return this.openTilesetSession(sessionId);

        const newTilesetSessionData = defaultTilesetSessionData(tileset.id);

        const newTilesetSession = new TilesetSession(tileset, newTilesetSessionData, this.editorContext);
        await newTilesetSession.loadTilesetSession();

        this.tilesetSessionMap.set(newTilesetSession.id, newTilesetSession);
        this.tilesetMap.set(tileset.id, newTilesetSession.id);

        this.openTilesetSession(newTilesetSession.id);

        this.emit("onCreateTilesetSession", newTilesetSession);

        Console.log({ message: { key: "message.tileset.openSuccess", options: { name: newTilesetSession.tileset.name } } });

        return newTilesetSession;
    }

    public openTilesetSession(sessionId: string): TilesetSession | null {
        const tilesetSession = this.tilesetSessionMap.get(sessionId);
        if (!tilesetSession) return null;

        this.activeSession = tilesetSession;

        this.tilesetSessionIdStack = this.tilesetSessionIdStack.filter(id => id !== sessionId);
        this.tilesetSessionIdStack.push(sessionId);

        this.emit("onOpenTilesetSession", tilesetSession);

        return tilesetSession;
    }

    public closeTilesetSession(sessionId: string): void {
        const tilesetSession = this.tilesetSessionMap.get(sessionId);
        if (!tilesetSession) return;

        tilesetSession.destroy();

        this.tilesetSessionMap.delete(sessionId);
        this.tilesetMap.delete(tilesetSession.tileset.id);
        this.tilesetSessionIdStack = this.tilesetSessionIdStack.filter(id => id !== sessionId);

        if (this.activeSession?.id === sessionId) {
            this.activeSession = null;
        }
        this.emit("onCloseTilesetSession", sessionId);

        Console.log({ message: { key: "message.tileset.closeSuccess", options: { name: tilesetSession.tileset.name } } })
    }

    public getSession(sessionId: string): TilesetSession | null {
        return this.tilesetSessionMap.get(sessionId) || null;
    }

    public getSessionByTilesetId(tilesetId: string): TilesetSession | null {
        const tilesetSessionId = this.tilesetMap.get(tilesetId);
        if (!tilesetSessionId) return null;
        return this.tilesetSessionMap.get(tilesetSessionId) || null;
    }

    public getLastTilesetSessionId(): string | null {
        if (this.tilesetSessionIdStack.length === 0) return null;
        return this.tilesetSessionIdStack[this.tilesetSessionIdStack.length - 1] || null;
    }

    public getActiveSessionView(): TilesetSessionView | null {
        return this.activeSessionView;
    }

    public registerActiveSessionView(view: TilesetSessionView | null) {
        this.activeSessionView = view
    }

    public unregisterActiveSessionView() {
        this.activeSessionView = null;
    }

    public serialize(): TilesetSessionManagerData {
        return {
            tilesetSessions: Array.from(this.tilesetSessionMap.values()).map(session => session.serialize()),
            currentTilesetSessionId: this.activeSession?.id || null,
        }
    }

    public async destroy(): Promise<void> {
        Array.from(this.tilesetSessionMap.values()).forEach(session => session.destroy());
        this.tilesetSessionMap.clear();
        this.tilesetMap.clear();
        this.removeAllListeners();
    }
}