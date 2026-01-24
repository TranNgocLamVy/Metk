import { AppCore } from "@/core/appcore";
import { Project } from "@/core/application/project";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";
import { useTilesetSessionStore } from "@/view/stores/application/tilesetSessionStore";

import { ToastService } from "./toastService";

export class WorkspaceService {
    private static saveWorkspaceTimeout: NodeJS.Timeout | null = null;

    public static async loadWorkspace(project: Project): Promise<void> {
        const result = await AppCore.getIns().workspaceManager.loadProjectWorkspace(project);
        if (result.status !== "Success") {
            ToastService.error({ message: result.message });
            return;
        }

        const tilesetPixiApp = useTilesetSessionStore.getState().pixiApp;
        const tilesetSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager;
        useTilesetSessionStore.getState().setTilesetSessionManager(tilesetSessionManager);
        const currentTilesetSessionId = tilesetSessionManager.tilesetSessionManagerData.currentTilesetSessionId
        if (currentTilesetSessionId && tilesetPixiApp) await WorkspaceService.openTilesetSession(currentTilesetSessionId);
        useTilesetSessionStore.getState().refresh();

        const tilemapPixiApp = useTilemapSessionStore.getState().pixiApp;
        const tilemapSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager;
        useTilemapSessionStore.getState().setTilemapSessionManager(tilemapSessionManager);
        const currentTilemapSessionId = tilemapSessionManager.tilemapSessionManagerData.currentTilemapSessionId
        if (currentTilemapSessionId && tilemapPixiApp) await WorkspaceService.openTilemapSession(currentTilemapSessionId);
        useTilemapSessionStore.getState().refresh();

        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async saveCurrentWorkspace({ waitForTimeout = true }: { waitForTimeout?: boolean } = {}): Promise<void> {
        if (!waitForTimeout) {
            await AppCore.getIns().workspaceManager.saveCurrentWorkspace();
            return;
        }

        if (WorkspaceService.saveWorkspaceTimeout) {
            clearTimeout(WorkspaceService.saveWorkspaceTimeout)
            WorkspaceService.saveWorkspaceTimeout = null;
        }
        WorkspaceService.saveWorkspaceTimeout = setTimeout(async () => {
            const result = await AppCore.getIns().workspaceManager.saveCurrentWorkspace();
            if (result.status !== "Success") {
                ToastService.error({ message: result.message });
                return;
            }
            WorkspaceService.saveWorkspaceTimeout = null;
        }, 1000);
    }


    //================ tileset ================
    public static async createTilesetSession(tilesetId: string): Promise<void> {
        const tilesetPixiApp = useTilesetSessionStore.getState().pixiApp;
        if (!tilesetPixiApp) {
            ToastService.error({ message: "Tileset pixi app not found" });
            return;
        }

        const tilesetResult = AppCore.getIns().editorContext.getCurrentProject().tilesetManager.getTilesetById(tilesetId);
        if (tilesetResult.status !== "Success" || !tilesetResult.data) {
            console.error(tilesetResult.message);
            ToastService.error({ message: tilesetResult.message });
            return;
        }
        const tileset = tilesetResult.data;

        const tilesetSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager;
        const result = await tilesetSessionManager.createTilesetSession(tileset, tilesetPixiApp);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async openTilesetSession(sessionId: string): Promise<void> {
        const tilesetPixiApp = useTilesetSessionStore.getState().pixiApp;
        if (!tilesetPixiApp) {
            ToastService.error({ message: "Tileset pixi app not found" });
            return;
        }

        const tilesetSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager;
        const result = await tilesetSessionManager.openTilesetSession(sessionId, tilesetPixiApp);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }

        useTilesetSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilesetSession(sessionId: string): Promise<void> {
        const tilesetSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager;
        const result = await tilesetSessionManager.closeTilesetSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }

        const lastSessionId = tilesetSessionManager.getLastTilesetSessionId();
        if (lastSessionId) await WorkspaceService.openTilesetSession(lastSessionId);

        useTilesetSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }


    //================ tilemap ================
    public static async createTilemapSession(tilemapId: string) {
        const tilesetPixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!tilesetPixiApp) {
            ToastService.error({ message: "Tilemap pixi app not found" });
            return;
        }

        const tilemapResult = AppCore.getIns().editorContext.getCurrentProject().tilemapManager.getTilemapById(tilemapId);
        if (tilemapResult.status !== "Success" || !tilemapResult.data) {
            console.error(tilemapResult.message);
            ToastService.error({ message: tilemapResult.message });
            return;
        }
        const tilemap = tilemapResult.data;

        const tilemapSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager;
        const result = await tilemapSessionManager.createTilemapSession(tilemap, tilesetPixiApp);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async openTilemapSession(sessionId: string): Promise<void> {
        const tilemapPixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!tilemapPixiApp) {
            ToastService.error({ message: "Tilemap pixi app not found" });
            return;
        }

        const tilemapSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager;
        const result = await tilemapSessionManager.openTilemapSession(sessionId, tilemapPixiApp);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }

        useLayerManagerStore.getState().setSession(result.data);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilemapSession(sessionId: string): Promise<void> {
        const tilemapSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager;
        const result = await tilemapSessionManager.closeTilemapSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }

        useLayerManagerStore.getState().setSession(null);

        const lastSessionId = tilemapSessionManager.getLastTilemapSessionId();
        if (lastSessionId) await WorkspaceService.openTilemapSession(lastSessionId);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }
}