import { AppCore } from "@/core/appcore";
import { Project } from "@/core/application/project";
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
        const tilesetsSession = AppCore.getCurrentWorkspace().tilesetSessionManager.tilesetsSession;
        useTilesetSessionStore.getState().setSessions(tilesetsSession);
        const currentTilesetSession = AppCore.getCurrentWorkspace().tilesetSessionManager.currentTilesetSession;
        if (currentTilesetSession) {
            useTilesetSessionStore.getState().openSession(currentTilesetSession)
        }

        useTilemapSessionStore.getState().clear();
        const tilemapsSession = AppCore.getCurrentWorkspace().tilemapSessionManager.tilemapsSession;
        useTilemapSessionStore.getState().setSessions(tilemapsSession);
        const currentTilemapSession = AppCore.getCurrentWorkspace().tilemapSessionManager.currentTilemapSession;
        if (currentTilemapSession) {
            useTilemapSessionStore.getState().openSession(currentTilemapSession)
        }
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

    public static async openTilesetViewSesion(sessionId: string): Promise<void> {
        const result = await AppCore.getCurrentWorkspace().openTilesetSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().openSession(result.data);
    }

    public static async createTilesetSession(tilesetId: string): Promise<void> {
        const tilesetResult = AppCore.getCurrentProject().tilesetManager.getTilesetById(tilesetId);
        if (tilesetResult.status !== "Success" || !tilesetResult.data) {
            console.error(tilesetResult.message);
            ToastService.error({ message: tilesetResult.message });
            return;
        }
        const tileset = tilesetResult.data;
        const result = await AppCore.getCurrentWorkspace().createTilesetSession(tileset);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().openSession(result.data);
    }

    public static async closeTilesetSession(sessionId: string): Promise<void> {
        const result = await AppCore.getCurrentWorkspace().closeTilesetSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().closeSession(sessionId);
    }

    public static async openTilemapViewSesion(sessionId: string): Promise<void> {
        const result = await AppCore.getCurrentWorkspace().openTilemapSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilemapSessionStore.getState().openSession(result.data);
    }

    public static async createTilemapSession(tilemapId: string) {
        const tilemapResult = AppCore.getCurrentProject().tilemapManager.getTilemapById(tilemapId);
        if (tilemapResult.status !== "Success" || !tilemapResult.data) {
            console.error(tilemapResult.message);
            ToastService.error({ message: tilemapResult.message });
            return;
        }
        const tilemap = tilemapResult.data;
        const result = await AppCore.getCurrentWorkspace().createTilemapSession(tilemap);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilemapSessionStore.getState().openSession(result.data);
    }

    public static async closeTilemapSession(sessionId: string): Promise<void> {
        const result = await AppCore.getCurrentWorkspace().closeTilemapSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilemapSessionStore.getState().closeSession(sessionId);
    }
}