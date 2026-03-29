import { AppCore } from "@/core/appcore";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";
import { useTilesetSessionStore } from "@/view/stores/application/tilesetSessionStore";

import { Result } from "../types/result";
import { TilemapService } from "./tilemapService";
import { TilesetService } from "./tilesetService";
import { ToastService } from "./toastService";

export class WorkspaceService {
    private static saveWorkspaceTimeout: NodeJS.Timeout | null = null; 

    public static async loadProjectWorkspace(projectId: string): Promise<Result> {
        const projectManager = AppCore.getIns().projectManager;

        const loadProjectResult = await projectManager.setAndLoadProject(projectId);
        if (loadProjectResult.status !== Result.Status.Success) {
            ToastService.error({ message: loadProjectResult.message });
            return loadProjectResult;
        }

        const project = loadProjectResult.data;

        await TilesetService.loadTilesetView(); // TODO: Refactor
        await TilemapService.loadTilemapEditor(); // TODO: Refactor

        const loadWorkspaceResult = await AppCore.getIns().workspaceManager.loadProjectWorkspace(project);
        if (loadWorkspaceResult.status !== Result.Status.Success) {
            ToastService.error({ message: loadWorkspaceResult.message });
            return loadWorkspaceResult;
        }

        const tilesetPixiApp = useTilesetSessionStore.getState().pixiApp;
        const tilesetSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager;
        const currentTilesetSessionId = tilesetSessionManager.tilesetSessionManagerData.currentTilesetSessionId;
        if (currentTilesetSessionId && tilesetPixiApp) await WorkspaceService.openTilesetSession(currentTilesetSessionId);
        useTilesetSessionStore.getState().refresh();

        const tilemapPixiApp = useTilemapSessionStore.getState().pixiApp;
        const tilemapSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager;
        const currentTilemapSessionId = tilemapSessionManager.tilemapSessionManagerData.currentTilemapSessionId;
        if (currentTilemapSessionId && tilemapPixiApp) await WorkspaceService.openTilemapSession(currentTilemapSessionId);
        useTilemapSessionStore.getState().refresh();

        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        return Result.Success();
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
            if (result.status !== Result.Status.Success) {
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

        const tilesetResult = await AppCore.getIns().editorContext.getCurrentProject().tilesetManager.loadTileset(tilesetId);
        if (tilesetResult.status !== Result.Status.Success) {
            ToastService.error({ message: tilesetResult.message });
            return;
        }

        const tileset = tilesetResult.data;

        const tilesetSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager;
        tilesetSessionManager.createTilesetSession(tileset, tilesetPixiApp);
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
        tilesetSessionManager.openTilesetSession(sessionId, tilesetPixiApp);

        useTilesetSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilesetSession(sessionId: string): Promise<void> {
        const tilesetSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager;
        tilesetSessionManager.closeTilesetSession(sessionId);

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

        const tilemapResult = await AppCore.getIns().editorContext.getCurrentProject().tilemapManager.loadTilemap(tilemapId);
        if (tilemapResult.status !== Result.Status.Success) {
            ToastService.error({ message: tilemapResult.message });
            return;
        }

        const tilemap = tilemapResult.data;

        const tilemapSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager;
        const tilemapSession = tilemapSessionManager.createTilemapSession(tilemap, tilesetPixiApp);

        useLayerManagerStore.getState().setSession(tilemapSession);

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
        const tilemapSession = tilemapSessionManager.openTilemapSession(sessionId, tilemapPixiApp);

        useLayerManagerStore.getState().setSession(tilemapSession);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilemapSession(sessionId: string): Promise<void> {
        const tilemapSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager;
        tilemapSessionManager.closeTilemapSession(sessionId);

        useLayerManagerStore.getState().setSession(null);

        const lastSessionId = tilemapSessionManager.getLastTilemapSessionId();
        if (lastSessionId) await WorkspaceService.openTilemapSession(lastSessionId);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }
}