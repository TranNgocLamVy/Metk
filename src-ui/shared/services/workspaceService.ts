import { appCore } from "@/core/appcore";
import { useLayerManagerStore } from "@/view/stores/layerManagerStore";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";
import { useTilesetSessionStore } from "@/view/stores/tilesetSessionStore";

import { Result } from "../types/result";
import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import { useLayoutStore } from "@/view/stores/layoutStore";
import { Model } from "flexlayout-react";
import { DialogService } from "./dialogService";
import { Console } from "./consoleService";

export class WorkspaceService {
    private static saveWorkspaceTimeout: NodeJS.Timeout | null = null; 

    public static async loadProjectWorkspace(projectId: string): Promise<Result> {
        const projectManager = appCore.projectManager;

        const loadProjectResult = await projectManager.setAndLoadProject(projectId);
        if (loadProjectResult.status !== Result.Status.Success) {
            Console.error({ message: loadProjectResult.message });
            return loadProjectResult;
        }

        const project = loadProjectResult.data;

        const loadWorkspaceResult = await appCore.workspaceManager.loadProjectWorkspace(project);
        if (loadWorkspaceResult.status !== Result.Status.Success) {
            Console.error({ message: loadWorkspaceResult.message });
            return loadWorkspaceResult;
        }
        const workspace = loadWorkspaceResult.data;

        // const loadLayoutResult = await appCore.layoutManager.loadLayout(project);
        // if (loadLayoutResult.status !== Result.Status.Success) {
        //     ToastService.error({ message: loadLayoutResult.message });
        // } else {   
        //     const workspaceLayout = loadLayoutResult.data;
        //     useLayoutStore.getState().setModel(Model.fromJson(workspaceLayout));
        // }
        // FIXME: handle load layout;
        
        const tilesetPixiApp = useTilesetSessionStore.getState().pixiApp;
        const tilesetSessionManager = workspace.tilesetSessionManager;
        const currentTilesetSessionId = tilesetSessionManager.tilesetSessionManagerData.currentTilesetSessionId;
        if (currentTilesetSessionId && tilesetPixiApp) await WorkspaceService.openTilesetSession(currentTilesetSessionId);
        useTilesetSessionStore.getState().refresh();

        const tilemapPixiApp = useTilemapSessionStore.getState().pixiApp;
        const tilemapSessionManager = workspace.tilemapSessionManager;
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
            await appCore.workspaceManager.saveCurrentWorkspace();
            return;
        }

        if (WorkspaceService.saveWorkspaceTimeout) {
            clearTimeout(WorkspaceService.saveWorkspaceTimeout)
            WorkspaceService.saveWorkspaceTimeout = null;
        }
        WorkspaceService.saveWorkspaceTimeout = setTimeout(async () => {
            const result = await appCore.workspaceManager.saveCurrentWorkspace();
            if (result.status !== Result.Status.Success) {
                Console.error({ message: result.message });
                return;
            }
            WorkspaceService.saveWorkspaceTimeout = null;
        }, 1000);
    }


    //================ tileset ================
    public static async createTilesetSession(tilesetId: string): Promise<void> {
        const tilesetPixiApp = useTilesetSessionStore.getState().pixiApp;
        if (!tilesetPixiApp) {
            Console.error({ message: "Tileset pixi app not found" }); // TODO: i18n
            return;
        }

        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return;

        const tilesetResult = await currentProject.tilesetManager.loadTileset({ id: tilesetId });
        if (tilesetResult.status !== Result.Status.Success) {
            Console.error({ message: tilesetResult.message });
            return;
        }

        const tileset = tilesetResult.data;

        const workspace = appCore.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilesetSessionManager = workspace.tilesetSessionManager;
        await tilesetSessionManager.createTilesetSession(tileset, tilesetPixiApp);
        useTilesetSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async openTilesetSession(sessionId: string): Promise<void> {
        const tilesetPixiApp = useTilesetSessionStore.getState().pixiApp;
        if (!tilesetPixiApp) return;

        const workspace = appCore.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilesetSessionManager = workspace.tilesetSessionManager;
        tilesetSessionManager.openTilesetSession(sessionId, tilesetPixiApp);

        useTilesetSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilesetSession(sessionId: string): Promise<void> {
        const workspace = appCore.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilesetSessionManager = workspace.tilesetSessionManager;

        const tilesetSession = tilesetSessionManager.getSession(sessionId);
        if (!tilesetSession) return;

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
            Console.error({ message: "Tilemap pixi app not found" }); // TODO: i18n
            return;
        }

        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return;

        const tilemapResult = await currentProject.tilemapManager.loadTilemap(tilemapId);
        if (tilemapResult.status !== Result.Status.Success) return;

        const tilemap = tilemapResult.data;

        const workspace = appCore.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilemapSessionManager = workspace.tilemapSessionManager;
        await tilemapSessionManager.createTilemapSession(tilemap, tilesetPixiApp);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async openTilemapSession(sessionId: string): Promise<void> {
        const tilemapPixiApp = useTilemapSessionStore.getState().pixiApp;
        if (!tilemapPixiApp) {
            Console.error({ message: "Tilemap pixi app not found" }); // TODO: i18n
            return;
        }

        const workspace = appCore.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilemapSessionManager = workspace.tilemapSessionManager;
        tilemapSessionManager.openTilemapSession(sessionId, tilemapPixiApp);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilemapSession(sessionId: string, force?: boolean): Promise<void> {
        const currentProject = appCore.editorContext.currentProject;
        const currentWorkspace = appCore.workspaceManager.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;
        
        const tilemapSessionManager = currentWorkspace.tilemapSessionManager;
        const tilemapSession = tilemapSessionManager.getSession(sessionId);
        if (!tilemapSession) return;

        const isDirty = tilemapSession.isDirty;
        if (isDirty && !force) {
            const saveResult = await DialogService.openSaveDialog({
                title: "dialog.saveBeforeClose.tilemap.title",
                description: "dialog.saveBeforeClose.tilemap.description",
            })
            if (saveResult === "cancel") {
                return;
            } else if (saveResult === "save") {
                await currentProject.tilemapManager.saveTilemap(tilemapSession.tilemap.id);
            }
        }
        tilemapSessionManager.closeTilemapSession(sessionId);

        useTilemapSessionStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }


    //================ ruleset ================
    public static async selectRuleset(rulesetId: string | null): Promise<void> {
        const rulesetSessionManager = appCore.workspaceManager.currentWorkspace?.rulesetSessionManager;
        if (!rulesetSessionManager) return;
        rulesetSessionManager.setSelectedRuleId(rulesetId);
        useRulesetManagerStore.getState().refresh();
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }
}