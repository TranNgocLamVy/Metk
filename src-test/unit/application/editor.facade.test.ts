import { describe, expect, it, vi } from "vitest";

import { EditorFacade } from "@/application/editor.facade";

const createFacade = (workspace: any = null, project: any = null) => {
    const projectManager = { currentProject: project };
    const workspaceManager = { currentWorkspace: workspace };
    const toolManager = {};
    const textureManager = {};
    const activationContext = {}
    return new EditorFacade(projectManager as any, workspaceManager as any, toolManager as any, textureManager as any, activationContext as any);
};

describe("EditorFacade", () => {
    it("forwards current project and workspace", () => {
        const project = { id: "project-a" };
        const workspace = { id: "workspace-a" };
        const facade = createFacade(workspace, project);

        expect(facade.currentProject).toBe(project);
        expect(facade.currentWorkspace).toBe(workspace);
    });

    it("returns null active tilemap and tileset sessions when workspace or sessions are missing", () => {
        expect(createFacade().getActiveTilemapSession()).toBeNull();
        expect(createFacade().getActiveTilesetSession()).toBeNull();

        const facade = createFacade({
            tilemapSessionManager: { activeSession: null },
            tilesetSessionManager: { activeSession: null },
        });

        expect(facade.getActiveTilemapSession()).toBeNull();
        expect(facade.getActiveTilesetSession()).toBeNull();
    });

    it("returns active sessions from the current workspace", () => {
        const tilemapSession = { id: "tilemap-session" };
        const tilesetSession = { id: "tileset-session" };
        const facade = createFacade({
            tilemapSessionManager: { activeSession: tilemapSession },
            tilesetSessionManager: { activeSession: tilesetSession },
        });

        expect(facade.getActiveTilemapSession()).toBe(tilemapSession);
        expect(facade.getActiveTilesetSession()).toBe(tilesetSession);
    });

    it("returns active views from session managers", () => {
        const tilemapView = { id: "tilemap-view" };
        const tilesetView = { id: "tileset-view" };
        const facade = createFacade({
            tilemapSessionManager: { getActiveView: vi.fn(() => tilemapView) },
            tilesetSessionManager: { getActiveView: vi.fn(() => tilesetView) },
        });

        expect(facade.getActiveTilemapView()).toBe(tilemapView);
        expect(facade.getActiveTilesetView()).toBe(tilesetView);
    });

    it("returns current history manager only when a tilemap session is active", () => {
        const historyManager = { id: "history" };
        expect(createFacade().getCurrentHistoryManager()).toBeNull();

        const facade = createFacade({
            tilemapSessionManager: {
                activeSession: { historyManager },
            },
        });

        expect(facade.getCurrentHistoryManager()).toBe(historyManager);
    });
});
