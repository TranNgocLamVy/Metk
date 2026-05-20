import { describe, expect, it, vi } from "vitest";

import { TilemapSessionManager } from "@/application/workspace/session/tilemap-session.manager";
import { Result } from "@/shared/types/result";

import { createEditorFacadeHarness } from "./session-manager-test-utils";

describe("TilemapSessionManager", () => {
    it("loads saved tilemap sessions, restores the active session, and serializes them", async () => {
        const { editorFacade, tilemap, tilemapManager, textureManager } = createEditorFacadeHarness();
        const manager = new TilemapSessionManager({
            tilemapSessions: [{
                id: "session-a",
                tilemapId: tilemap.id,
                viewState: { x: 12, y: 24, zoom: 2 },
                layerState: { selectedLayers: ["tile-root"] },
            }],
            currentTilemapSessionId: "session-a",
        }, editorFacade);
        const opened = vi.fn();
        manager.on("onOpenTilemapSession", opened);

        const result = await manager.loadTilemapSessions(tilemapManager as any);

        expect(result.status).toBe(Result.Status.Success);
        expect(tilemapManager.loadTilemap).toHaveBeenCalledWith(tilemap.id);
        expect(textureManager.retainTilesetGraphics).toHaveBeenCalledTimes(1);
        expect(manager.activeSession?.id).toBe("session-a");
        expect(opened).toHaveBeenCalledWith(manager.activeSession);
        expect(manager.serialize()).toEqual({
            tilemapSessions: [{
                id: "session-a",
                tilemapId: tilemap.id,
                viewState: { x: 12, y: 24, zoom: 2 },
                layerState: { selectedLayers: ["tile-root"] },
            }],
            currentTilemapSessionId: "session-a",
        });
    });

    it("returns an error and does not create a session when loading a tilemap fails", async () => {
        const { editorFacade, tilemapManager } = createEditorFacadeHarness();
        const manager = new TilemapSessionManager({
            tilemapSessions: [{
                id: "missing-session",
                tilemapId: "missing-map",
                viewState: { x: null, y: null, zoom: 1 },
                layerState: { selectedLayers: [] },
            }],
            currentTilemapSessionId: "missing-session",
        }, editorFacade);

        const result = await manager.loadTilemapSessions(tilemapManager as any);

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "tilemap load failed" },
        });
        expect(manager.tilemapsSession).toEqual([]);
        expect(manager.activeSession).toBeNull();
    });

    it("creates, opens, and emits a new tilemap session", async () => {
        const { editorFacade, tilemap } = createEditorFacadeHarness();
        const manager = new TilemapSessionManager({ tilemapSessions: [], currentTilemapSessionId: null }, editorFacade);
        const created = vi.fn();
        const opened = vi.fn();
        manager.on("onCreateTilemapSession", created);
        manager.on("onOpenTilemapSession", opened);

        const session = await manager.createTilemapSession(tilemap);

        expect(session).not.toBeNull();
        expect(manager.activeSession).toBe(session);
        expect(created).toHaveBeenCalledWith(session);
        expect(opened).toHaveBeenCalledWith(session);
        expect(manager.getSession(session!.id)).toBe(session);
        expect(manager.getSessionByTilemapId(tilemap.id)).toBe(session);
    });

    it("reuses and opens an existing session when creating a duplicate tilemap session", async () => {
        const { editorFacade, tilemap } = createEditorFacadeHarness();
        const manager = new TilemapSessionManager({ tilemapSessions: [], currentTilemapSessionId: null }, editorFacade);
        const created = vi.fn();
        const opened = vi.fn();
        manager.on("onCreateTilemapSession", created);
        manager.on("onOpenTilemapSession", opened);

        const first = await manager.createTilemapSession(tilemap);
        const second = await manager.createTilemapSession(tilemap);

        expect(second).toBe(first);
        expect(manager.tilemapsSession).toHaveLength(1);
        expect(created).toHaveBeenCalledTimes(1);
        expect(opened).toHaveBeenCalledTimes(2);
    });

    it("returns null when opening or closing a missing session and leaves state unchanged", () => {
        const { editorFacade } = createEditorFacadeHarness();
        const manager = new TilemapSessionManager({ tilemapSessions: [], currentTilemapSessionId: null }, editorFacade);
        const closed = vi.fn();
        manager.on("onCloseTilemapSession", closed);

        expect(manager.openTilemapSession("missing-session")).toBeNull();
        manager.closeTilemapSession("missing-session");

        expect(manager.activeSession).toBeNull();
        expect(closed).not.toHaveBeenCalled();
    });

    it("closes a session, unloads tilemap resources, clears active state, and emits close", async () => {
        const { editorFacade, tilemap, tilemapManager, textureManager } = createEditorFacadeHarness();
        const manager = new TilemapSessionManager({ tilemapSessions: [], currentTilemapSessionId: null }, editorFacade);
        const closed = vi.fn();
        manager.on("onCloseTilemapSession", closed);
        const session = await manager.createTilemapSession(tilemap);

        manager.closeTilemapSession(session!.id);

        expect(manager.getSession(session!.id)).toBeNull();
        expect(manager.getSessionByTilemapId(tilemap.id)).toBeNull();
        expect(manager.activeSession).toBeNull();
        expect(textureManager.releaseTilesetGraphics).toHaveBeenCalledWith("tileset-a");
        expect(tilemapManager.unloadTilemap).toHaveBeenCalledWith(tilemap.id);
        expect(closed).toHaveBeenCalledWith(session!.id);
    });

    it("registers and unregisters the active tilemap view", () => {
        const { editorFacade } = createEditorFacadeHarness();
        const manager = new TilemapSessionManager({ tilemapSessions: [], currentTilemapSessionId: null }, editorFacade);
        const view = { id: "view-a" } as any;

        manager.registerActiveView(view);
        expect(manager.getActiveView()).toBe(view);

        manager.unregisterActiveView();
        expect(manager.getActiveView()).toBeNull();
    });

    it("destroys all sessions, clears lookup maps, and removes listeners", async () => {
        const { editorFacade, tilemap, textureManager } = createEditorFacadeHarness();
        const manager = new TilemapSessionManager({ tilemapSessions: [], currentTilemapSessionId: null }, editorFacade);
        const opened = vi.fn();
        manager.on("onOpenTilemapSession", opened);
        const session = await manager.createTilemapSession(tilemap);

        await manager.detroy();

        expect(textureManager.releaseTilesetGraphics).toHaveBeenCalledWith("tileset-a");
        expect(manager.tilemapsSession).toEqual([]);
        expect(manager.getSession(session!.id)).toBeNull();
        expect(manager.getSessionByTilemapId(tilemap.id)).toBeNull();
        manager.openTilemapSession(session!.id);
        expect(opened).toHaveBeenCalledTimes(1);
    });
});
