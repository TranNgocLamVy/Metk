import { appKernel } from "@/application/bootstrap/app-kernel";

import { Result } from "@/shared/types/result";
import { DialogService } from "@/ui/dialogs/dialog-gateway";
import { Console } from "@/ui/notifications/console-gateway";

export async function loadProjectWorkspace(projectId: string): Promise<Result> {
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

        const loadWorkspaceResult = await appKernel.workspaceManager.loadWorkspace(project);
        if (loadWorkspaceResult.status !== Result.Status.Success) {
            Console.error({ message: loadWorkspaceResult.message });
            return loadWorkspaceResult;
        }
        const workspace = loadWorkspaceResult.data;

        const tilesetSessionManager = workspace.tilesetSessionManager;
        const currentTilesetSessionId = tilesetSessionManager.tilesetSessionManagerData.currentTilesetSessionId;
        if (currentTilesetSessionId) await openTilesetSession(currentTilesetSessionId);

        saveCurrentWorkspace({ waitForTimeout: false }); // Can be remove

        return Result.Success();
}

export async function unloadProjectWorkspace(): Promise<void> {
        appKernel.projectManager.unLoadProject();
        appKernel.workspaceManager.unloadWorkspace();
        appKernel.layoutManager.unloadLayout();
}

export async function saveCurrentWorkspace({ waitForTimeout = true }: { waitForTimeout?: boolean } = {}): Promise<void> {
        await appKernel.workspaceManager.saveCurrentWorkspace(waitForTimeout);
}


    //================ tileset ================
export async function createTilesetSession(tilesetId: string): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;
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
        saveCurrentWorkspace({ waitForTimeout: false });
}

export async function openTilesetSession(sessionId: string): Promise<void> {
        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilesetSessionManager = workspace.tilesetSessionManager;
        tilesetSessionManager.openTilesetSession(sessionId);

        saveCurrentWorkspace({ waitForTimeout: false });
}

export async function closeTilesetSession(sessionId: string): Promise<void> {
        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilesetSessionManager = workspace.tilesetSessionManager;

        const tilesetSession = tilesetSessionManager.getSession(sessionId);
        if (!tilesetSession) return;

        tilesetSessionManager.closeTilesetSession(sessionId);

        const lastSessionId = tilesetSessionManager.getLastTilesetSessionId();
        if (lastSessionId) await openTilesetSession(lastSessionId);

        saveCurrentWorkspace({ waitForTimeout: false });
}


    //================ tilemap ================
export async function createTilemapSession(tilemapId: string): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return;

        const tilemapResult = await currentProject.tilemapManager.loadTilemap(tilemapId);
        if (tilemapResult.status !== Result.Status.Success) return;

        const tilemap = tilemapResult.data;

        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilemapSessionManager = workspace.tilemapSessionManager;
        await tilemapSessionManager.createTilemapSession(tilemap);

        saveCurrentWorkspace({ waitForTimeout: false });
}

export async function openTilemapSession(sessionId: string): Promise<void> {
        const workspace = appKernel.workspaceManager.currentWorkspace;
        if (!workspace) return;

        const tilemapSessionManager = workspace.tilemapSessionManager;
        tilemapSessionManager.openTilemapSession(sessionId);

        saveCurrentWorkspace({ waitForTimeout: false });
}

export async function closeTilemapSession(sessionId: string, force?: boolean): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;
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

        saveCurrentWorkspace({ waitForTimeout: false });
}


    //================ ruleset ================
export async function selectRuleset(rulesetId: string | null): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;
        const rulesetSessionManager = appKernel.workspaceManager.currentWorkspace?.rulesetSessionManager;
        if (!currentProject || !rulesetSessionManager) return;
        if (rulesetId) await currentProject.rulesetManager.loadRuleset(rulesetId);
        rulesetSessionManager.setSelectedRuleId(rulesetId);
        saveCurrentWorkspace({ waitForTimeout: false });
}
