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

        useTilesetSessionStore.getState().clear();
        const tilesetsSession = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager.tilesetsSession;
        useTilesetSessionStore.getState().setSessions(tilesetsSession);
        const currentTilesetSession = AppCore.getIns().editorContext.getCurrentTilesetSession();
        if (currentTilesetSession) useTilesetSessionStore.getState().openSession(currentTilesetSession)

        WorkspaceService.clearTilemapSessions();
        const tilemapsSession = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager.tilemapsSession;
        useTilemapSessionStore.getState().setTilemapSessions(tilemapsSession);
        const currentTilemapSession = AppCore.getIns().editorContext.getCurrentTilemapSession();
        if (currentTilemapSession) await WorkspaceService.openTilemapSession(currentTilemapSession.id)
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

    public static async openTilesetViewSesion(sessionId: string): Promise<void> {
        const result = await AppCore.getIns().editorContext.getCurrentWorkspace().openTilesetSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().openSession(result.data);
    }

    public static async createTilesetSession(tilesetId: string): Promise<void> {
        const tilesetResult = AppCore.getIns().editorContext.getCurrentProject().tilesetManager.getTilesetById(tilesetId);
        if (tilesetResult.status !== "Success" || !tilesetResult.data) {
            console.error(tilesetResult.message);
            ToastService.error({ message: tilesetResult.message });
            return;
        }
        const tileset = tilesetResult.data;
        const result = await AppCore.getIns().editorContext.getCurrentWorkspace().createTilesetSession(tileset);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().openSession(result.data);
    }

    public static async closeTilesetSession(sessionId: string): Promise<void> {
        const result = await AppCore.getIns().editorContext.getCurrentWorkspace().closeTilesetSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().closeSession(sessionId);
    }


    //================ tilemap ================

    public static async createTilemapSession(tilemapId: string) {
        const tilemapResult = AppCore.getIns().editorContext.getCurrentProject().tilemapManager.getTilemapById(tilemapId);
        if (tilemapResult.status !== "Success" || !tilemapResult.data) {
            console.error(tilemapResult.message);
            ToastService.error({ message: tilemapResult.message });
            return;
        }
        const tilemap = tilemapResult.data;
        const result = await AppCore.getIns().editorContext.getCurrentWorkspace().createTilemapSession(tilemap);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilemapSessionStore.getState().openTilemapSession(result.data);
        useLayerManagerStore.getState().setSession(result.data);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async openTilemapSession(sessionId: string): Promise<void> {
        const result = await AppCore.getIns().editorContext.getCurrentWorkspace().openTilemapSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilemapSessionStore.getState().openTilemapSession(result.data);
        useLayerManagerStore.getState().setSession(result.data);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilemapSession(sessionId: string): Promise<void> {
        const result = await AppCore.getIns().editorContext.getCurrentWorkspace().closeTilemapSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilemapSessionStore.getState().closeTilemapSession(sessionId);
        useLayerManagerStore.getState().setSession(null);
        const tilemapSessionIdStack = useTilemapSessionStore.getState().tilemapSessionIdStack
        const lastSessionId = tilemapSessionIdStack[tilemapSessionIdStack.length - 1];
        if (lastSessionId) WorkspaceService.openTilemapSession(lastSessionId);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static clearTilemapSessions() {
        useTilemapSessionStore.getState().clearTilemapSessions();
    }
}