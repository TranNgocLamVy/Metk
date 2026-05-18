import { appKernel } from "@/application/bootstrap/app-kernel";

import { Result } from "../types/result";
import { DialogService } from "./dialog.service";
import { Console } from "./console.service";

export class WorkspaceService {
    public static async loadProjectWorkspace(projectId: string): Promise<Result> {
        const projectManager = appKernel.projectManager;

        const loadProjectResult = await projectManager.setAndLoadProject(projectId);
        if (loadProjectResult.status !== Result.Status.Success) {
            Console.error({ message: loadProjectResult.message });
            return loadProjectResult;
        }

        const project = loadProjectResult.data;

        const loadLayoutResult = await appKernel.layoutManager.loadLayout(project);
        if (loadLayoutResult.status !== Result.Status.Success) {
            Console.error({ message: loadLayoutResult.message });
        }

        const loadWorkspaceResult = await appKernel.workspaceManager.loadProjectWorkspace(project);
        if (loadWorkspaceResult.status !== Result.Status.Success) {
            Console.error({ message: loadWorkspaceResult.message });
            return loadWorkspaceResult;
        }
        const workspace = loadWorkspaceResult.data;

        const tilesetSessionManager = workspace.tilesetSessionManager;
        const currentTilesetSessionId = tilesetSessionManager.tilesetSessionManagerData.currentTilesetSessionId;
        if (currentTilesetSessionId) await WorkspaceService.openTilesetSession(currentTilesetSessionId);

        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false }); // Can be remove

        return Result.Success();
    }

    public static async unloadProjectWorkspace(): Promise<void> {
        appKernel.projectManager.unLoadProject();
        appKernel.workspaceManager.unloadWorkspace();
        appKernel.layoutManager.unloadLayout();
    }

    public static async saveCurrentWorkspace({ waitForTimeout = true }: { waitForTimeout?: boolean } = {}): Promise<void> {
        await appKernel.workspaceManager.saveCurrentWorkspace(waitForTimeout);
    }


    //================ tileset ================
    public static async createTilesetSession(tilesetId: string): Promise<void> {
        const currentProject = appKernel.editorContext.currentProject;
        if (!currentProject) return;

        const tilesetResult = await currentProject.tilesetManager.loadTileset(tilesetId);
        if (tilesetResult.status !== Result.Status.Success) {
            Console.error({ message: tilesetResult.message });
            return;
        }

        const tileset = tilesetResult.data;

        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilesetSessionManager = workspace.tilesetSessionManager;
        await tilesetSessionManager.createTilesetSession(tileset);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async openTilesetSession(sessionId: string): Promise<void> {
        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilesetSessionManager = workspace.tilesetSessionManager;
        tilesetSessionManager.openTilesetSession(sessionId);

        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilesetSession(sessionId: string): Promise<void> {
        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilesetSessionManager = workspace.tilesetSessionManager;

        const tilesetSession = tilesetSessionManager.getSession(sessionId);
        if (!tilesetSession) return;

        tilesetSessionManager.closeTilesetSession(sessionId);

        const lastSessionId = tilesetSessionManager.getLastTilesetSessionId();
        if (lastSessionId) await WorkspaceService.openTilesetSession(lastSessionId);

        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }


    //================ tilemap ================
    public static async createTilemapSession(tilemapId: string) {
        const currentProject = appKernel.editorContext.currentProject;
        if (!currentProject) return;

        const tilemapResult = await currentProject.tilemapManager.loadTilemap(tilemapId);
        if (tilemapResult.status !== Result.Status.Success) return;

        const tilemap = tilemapResult.data;

        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilemapSessionManager = workspace.tilemapSessionManager;
        await tilemapSessionManager.createTilemapSession(tilemap);

        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async openTilemapSession(sessionId: string): Promise<void> {
        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilemapSessionManager = workspace.tilemapSessionManager;
        tilemapSessionManager.openTilemapSession(sessionId);

        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async closeTilemapSession(sessionId: string, force?: boolean): Promise<void> {
        const currentProject = appKernel.editorContext.currentProject;
        const currentWorkspace = appKernel.workspaceManager.currentWorkspace;
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

        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }


    //================ ruleset ================
    public static async selectRuleset(rulesetId: string | null): Promise<void> {
        const currentProject = appKernel.editorContext.currentProject;
        const rulesetSessionManager = appKernel.workspaceManager.currentWorkspace?.rulesetSessionManager;
        if (!currentProject || !rulesetSessionManager) return;
        if (rulesetId) await currentProject.rulesetManager.loadRuleset(rulesetId);
        rulesetSessionManager.setSelectedRuleId(rulesetId);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }
}