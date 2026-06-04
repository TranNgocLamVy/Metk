import { describe, expect, it, vi } from "vitest";

import { TilesetSessionManager } from "@/application/workspace/session/tileset-session.manager";
import { Result } from "@/shared/types/result";

import { createEditorFacadeHarness } from "./session-manager-test-utils";

describe("TilesetSessionManager", () => {
    it("loads saved tileset sessions and serializes them", async () => {
        const { editorFacade, tileset, tilesetManager, textureManager } = createEditorFacadeHarness();
        const manager = new TilesetSessionManager({
            tilesetSessions: [{
                id: "session-a",
                tilesetId: tileset.id,
                viewState: { x: 4, y: 8, zoom: 3 },
                selectionState: { selectedTilesSet: [1, 2] },
            }],
            currentTilesetSessionId: "session-a",
        }, editorFacade);

        const result = await manager.loadTilesetSessions(tilesetManager as any);

        expect(result.status).toBe(Result.Status.Success);
        expect(tilesetManager.loadTileset).toHaveBeenCalledWith(tileset.id);
        expect(textureManager.retainTilesetGraphics).toHaveBeenCalledWith(tileset);
        expect(manager.activeSession).toBeNull();
        expect(manager.serialize()).toEqual({
            tilesetSessions: [{
                id: "session-a",
                tilesetId: tileset.id,
                viewState: { x: 4, y: 8, zoom: 3 },
                selectionState: { selectedTilesSet: [1, 2] },
            }],
            currentTilesetSessionId: null,
        });
    });

    it("returns an error and does not create a session when loading a tileset fails", async () => {
        const { editorFacade, tilesetManager } = createEditorFacadeHarness();
        const manager = new TilesetSessionManager({
            tilesetSessions: [{
                id: "missing-session",
                tilesetId: "missing-tileset",
                viewState: { x: null, y: null, zoom: 1 },
                selectionState: { selectedTilesSet: [] },
            }],
            currentTilesetSessionId: "missing-session",
        }, editorFacade);

        const result = await manager.loadTilesetSessions(tilesetManager as any);

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "tileset load failed" },
        });
        expect(manager.tilesetsSession).toEqual([]);
        expect(manager.activeSession).toBeNull();
    });

    it("creates, opens, and emits a new tileset session", async () => {
        const { editorFacade, tileset, textureManager } = createEditorFacadeHarness();
        const manager = new TilesetSessionManager({ tilesetSessions: [], currentTilesetSessionId: null }, editorFacade);
        const created = vi.fn();
        const opened = vi.fn();
        manager.on("onCreateTilesetSession", created);
        manager.on("onOpenTilesetSession", opened);

        const session = await manager.createTilesetSession(tileset);

        expect(session).not.toBeNull();
        expect("historyManager" in session!).toBe(false);
        expect(manager.activeSession).toBe(session);
        expect(textureManager.retainTilesetGraphics).toHaveBeenCalledWith(tileset);
        expect(created).toHaveBeenCalledWith(session);
        expect(opened).toHaveBeenCalledWith(session);
        expect(manager.getSession(session!.id)).toBe(session);
        expect(manager.getSessionByTilesetId(tileset.id)).toBe(session);
        expect(manager.getLastTilesetSessionId()).toBe(session!.id);
    });

    it("reuses and opens an existing session when creating a duplicate tileset session", async () => {
        const { editorFacade, tileset } = createEditorFacadeHarness();
        const manager = new TilesetSessionManager({ tilesetSessions: [], currentTilesetSessionId: null }, editorFacade);
        const created = vi.fn();
        const opened = vi.fn();
        manager.on("onCreateTilesetSession", created);
        manager.on("onOpenTilesetSession", opened);

        const first = await manager.createTilesetSession(tileset);
        const second = await manager.createTilesetSession(tileset);

        expect(second).toBe(first);
        expect(manager.tilesetsSession).toHaveLength(1);
        expect(created).toHaveBeenCalledTimes(1);
        expect(opened).toHaveBeenCalledTimes(2);
        expect(manager.getLastTilesetSessionId()).toBe(first!.id);
    });

    it("returns null when opening or closing a missing session and leaves state unchanged", () => {
        const { editorFacade } = createEditorFacadeHarness();
        const manager = new TilesetSessionManager({ tilesetSessions: [], currentTilesetSessionId: null }, editorFacade);
        const closed = vi.fn();
        manager.on("onCloseTilesetSession", closed);

        expect(manager.openTilesetSession("missing-session")).toBeNull();
        manager.closeTilesetSession("missing-session");

        expect(manager.activeSession).toBeNull();
        expect(manager.getLastTilesetSessionId()).toBeNull();
        expect(closed).not.toHaveBeenCalled();
    });

    it("tracks most recently opened tileset sessions and removes closed sessions from the stack", async () => {
        const { editorFacade, tileset } = createEditorFacadeHarness();
        const secondTileset = { ...tileset, id: "tileset-b", name: "tileset-b name" } as typeof tileset;
        const manager = new TilesetSessionManager({ tilesetSessions: [], currentTilesetSessionId: null }, editorFacade);

        const first = await manager.createTilesetSession(tileset);
        const second = await manager.createTilesetSession(secondTileset);
        manager.openTilesetSession(first!.id);

        expect(manager.getLastTilesetSessionId()).toBe(first!.id);

        manager.closeTilesetSession(first!.id);

        expect(manager.getLastTilesetSessionId()).toBe(second!.id);
    });

    it("closes a session, releases retained graphics, clears active state, and emits close", async () => {
        const { editorFacade, tileset, textureManager } = createEditorFacadeHarness();
        const manager = new TilesetSessionManager({ tilesetSessions: [], currentTilesetSessionId: null }, editorFacade);
        const closed = vi.fn();
        manager.on("onCloseTilesetSession", closed);
        const session = await manager.createTilesetSession(tileset);

        manager.closeTilesetSession(session!.id);

        expect(manager.getSession(session!.id)).toBeNull();
        expect(manager.getSessionByTilesetId(tileset.id)).toBeNull();
        expect(manager.activeSession).toBeNull();
        expect(textureManager.releaseTilesetGraphics).toHaveBeenCalledWith(tileset.id);
        expect(closed).toHaveBeenCalledWith(session!.id);
    });

    it("registers and unregisters the active tileset view", () => {
        const { editorFacade } = createEditorFacadeHarness();
        const manager = new TilesetSessionManager({ tilesetSessions: [], currentTilesetSessionId: null }, editorFacade);
        const view = { id: "view-a" } as any;

        manager.registerActiveView(view);
        expect(manager.getActiveView()).toBe(view);

        manager.unregisterActiveView();
        expect(manager.getActiveView()).toBeNull();
    });

    it("destroys all sessions, clears lookup maps, and removes listeners", async () => {
        const { editorFacade, tileset, textureManager } = createEditorFacadeHarness();
        const manager = new TilesetSessionManager({ tilesetSessions: [], currentTilesetSessionId: null }, editorFacade);
        const opened = vi.fn();
        manager.on("onOpenTilesetSession", opened);
        const session = await manager.createTilesetSession(tileset);

        await manager.destroy();

        expect(textureManager.releaseTilesetGraphics).toHaveBeenCalledWith(tileset.id);
        expect(manager.tilesetsSession).toEqual([]);
        expect(manager.getSession(session!.id)).toBeNull();
        expect(manager.getSessionByTilesetId(tileset.id)).toBeNull();
        manager.openTilesetSession(session!.id);
        expect(opened).toHaveBeenCalledTimes(1);
    });
});
