import { AppCore } from "@/core/appcore";
import { useLayerManagerStore } from "@/view/stores/layerManagerStore";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";
import { useTilesetSessionStore } from "@/view/stores/tilesetSessionStore";

import { Result } from "../types/result";
import { TilemapService } from "./tilemapService";
import { TilesetService } from "./tilesetService";
import { ToastService } from "./toastService";
import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";

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

        useLayerManagerStore.getState().refresh();
        useRulesetManagerStore.getState().refresh();

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

        const tilesetResult = await AppCore.getIns().editorContext.getCurrentProject().tilesetManager.loadTileset({ id: tilesetId });
        if (tilesetResult.status !== Result.Status.Success) {
            ToastService.error({ message: tilesetResult.message });
            return;
        }

        const tileset = tilesetResult.data;

        const tilesetSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilesetSessionManager;
        await tilesetSessionManager.createTilesetSession(tileset, tilesetPixiApp);
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
        await tilemapSessionManager.createTilemapSession(tilemap, tilesetPixiApp);

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
        tilemapSessionManager.openTilemapSession(sessionId, tilemapPixiApp);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilemapSession(sessionId: string): Promise<void> {
        const tilemapSessionManager = AppCore.getIns().editorContext.getCurrentWorkspace().tilemapSessionManager;
        tilemapSessionManager.closeTilemapSession(sessionId);

        const lastSessionId = tilemapSessionManager.getLastTilemapSessionId();
        if (lastSessionId) await WorkspaceService.openTilemapSession(lastSessionId);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async selectRuleset(rulesetId: string | null): Promise<void> {
        const rulesetSessionManager = AppCore.getIns().workspaceManager.currentWorkspace?.rulesetSessionManager;
        if (!rulesetSessionManager) return;
        rulesetSessionManager.setSelectedRuleId(rulesetId);
        useRulesetManagerStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }
}