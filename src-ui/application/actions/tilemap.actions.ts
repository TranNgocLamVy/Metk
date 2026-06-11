import { appKernel } from "@/application/bootstrap/app-kernel";
import { extractTilemapId, normalizeTilemapData } from "@/editor/model/tilemap/tilemap.normalizer";
import { FileDialogService, TilemapStorageService } from "@/infrastructure/container";
import i18n from "@/app/providers/i18n";
import { v4 as uuidv4 } from "uuid";
import { createTilemapForm } from "@/shared/constant/form/create-tilemap.form";
import { CreateTilemapPayload, TilemapData, TilemapOrientation } from "@/shared/data-types/tilemap.data";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/path.utils";
import { Console } from "@/ui/notifications/console-gateway";
import { DialogService } from "@/ui/dialogs/dialog-gateway";
import { closeTilemapSession, createTilemapSession, saveCurrentWorkspace } from "@/application/actions/workspace.actions";

export async function createTilemap(): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;

        const form = await DialogService.openFormDialog(createTilemapForm());
        if (!form) return;

        const defaultTilemapDir = currentWorkspace.savedPathManager.getTilemapDir();

        const tilemapAbsPath = await FileDialogService.saveFile({ title: i18n.t("dialog.save.tilemap.title"), defaultPath: defaultTilemapDir, filters: [{ name: i18n.t("fileDialog.filters.tilemap"), extensions: ["tm.json"] }] });
        if (!tilemapAbsPath) return;

        const tilemapAbsDir = PathUtils.dirname(tilemapAbsPath);
        currentWorkspace.savedPathManager.setTilemapDir(tilemapAbsDir);

        const createTilemapPayload: CreateTilemapPayload = {
            id: uuidv4(),
            name: form.tilemap.name,
            orientation: form.tilemap.type as TilemapOrientation,
            height: form.options.map.mapheight,
            width: form.options.map.mapwidth,
            tileWidth: form.options.tile.tileWidth,
            tileHeight: form.options.tile.tileHeight,
        }

        let tilemapData: TilemapData;
        try {
            tilemapData = normalizeTilemapData(createTilemapPayload);
        } catch (error) {
            Console.error({ message: `Failed to create tilemap: ${String(error)}` });
            return;
        }

        const saveResult = await TilemapStorageService.save(tilemapAbsPath, tilemapData);
        if (saveResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.tilemap.saveFail",
                stacks: saveResult.message ? [saveResult.message] : [],
            })
            return;
        }

        await currentProject.tilemapManager.addTilemap(tilemapData, tilemapAbsPath);
        await editorFacade.projectManager.saveCurrrentProject();

        await saveCurrentWorkspace({ waitForTimeout: false });
        createTilemapSession(tilemapData.id);

        Console.success({ message: "message.tilemap.createSuccess" });
}

export async function importTilemap(refTilemapId?: string): Promise<Result> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        const defaultTilemapDir = currentWorkspace.savedPathManager.getTilemapDir();

        const tilemapAbsPath = await FileDialogService.open({ defaultPath: defaultTilemapDir, multiple: false, filters: [{ name: i18n.t("fileDialog.filters.tilemap"), extensions: ["tm.json"] }] });
        if (!tilemapAbsPath) return Result.Cancel();

        const loadTilemapResult = await TilemapStorageService.load(tilemapAbsPath);
        if (loadTilemapResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.tilemap.importFail",
                stacks: ["message.tilemap.loadFail", loadTilemapResult.message!, ...loadTilemapResult.stacks!]
            })
            return Result.Error(loadTilemapResult.message);
        }

        const tilemapAbsDir = PathUtils.dirname(tilemapAbsPath);
        currentWorkspace.savedPathManager.setTilemapDir(tilemapAbsDir);

        let tilemapId: string;
        try {
            tilemapId = extractTilemapId(loadTilemapResult.data);
        } catch (error) {
            Console.error({
                message: "message.tilemap.importFail",
                stacks: [String(error)],
            });
            return Result.Error("message.tilemap.importFail");
        }

        if (refTilemapId && tilemapId !== refTilemapId) {
            Console.error({
                message: "message.tilemap.importFail",
                stacks: ["message.tilemap.mismatchId"]
            });
            return Result.Cancel();
        }

        const addTilemapResult = await currentProject.tilemapManager.addTilemap(loadTilemapResult.data, tilemapAbsPath);
        if (addTilemapResult.status !== Result.Status.Success) return addTilemapResult;

        await editorFacade.projectManager.saveCurrrentProject();

        createTilemapSession(addTilemapResult.data.id);

        Console.success({ message: "message.tilemap.importSuccess" });

        return Result.Success();
}

export async function removeTilemapFromProject(tilemapId: string): Promise<Result> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;

        if (!currentProject) return Result.Cancel();

        const confirmRemoval = await DialogService.openPermissionDialog({
            title: "dialog.remove.tilemap.title",
            description: "dialog.remove.tilemap.description",
        });
        if (!confirmRemoval) return Result.Cancel();

        const removeResult = await currentProject.tilemapManager.removeTilemapMetadata(tilemapId);
        if (removeResult.status !== Result.Status.Success) return Result.Cancel();

        await editorFacade.projectManager.saveCurrrentProject();

        const tilemapSession = editorFacade.currentWorkspace?.tilemapSessionManager.getSessionByTilemapId(tilemapId);
        if (tilemapSession) {
            await closeTilemapSession(tilemapSession.id);
            await saveCurrentWorkspace({ waitForTimeout: false });
        }

        return removeResult;
}

export async function deleteTilemapFile(tilemapId: string): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;

        if (!currentProject) return;

        const confirmDeletion = await DialogService.openPermissionDialog({
            title: "dialog.delete.tilemap.title",
            description: "dialog.delete.tilemap.description",
        });
        if (!confirmDeletion) return;

        const deleteTilemapResult = await currentProject.tilemapManager.deleteTilemap(tilemapId);
        if (deleteTilemapResult.status !== Result.Status.Success) return;

        await editorFacade.projectManager.saveCurrrentProject();

        const tilemapSession = editorFacade.currentWorkspace?.tilemapSessionManager.getSessionByTilemapId(tilemapId);
        if (tilemapSession) {
            await closeTilemapSession(tilemapSession.id, true);
            await saveCurrentWorkspace({ waitForTimeout: false });
        }
}
