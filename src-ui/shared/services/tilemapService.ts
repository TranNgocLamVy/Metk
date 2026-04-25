import { v4 as uuidv4 } from "uuid";

import { appCore } from "@/core/appcore";

import { TilemapData } from "../schema/tilemapSchema";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { Result } from "../types/result";
import { WorkspaceService } from "./workspaceService";
import { TilemapStorageService } from "@/infrastructure/container";
import { PathUtils } from "../utils/pathUtils";
import { DialogService } from "./dialogService";
import { createTilemapForm } from "../constant/form/createTilemapForm";
import { Console } from "./consoleService";
import i18n from "@/core/service/i18n";

export class TilemapService {

    public static async createTilemap(): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;
        
        const form = await DialogService.openFormDialog(createTilemapForm());
        if (!form) return;
        
        let defaultDir: string;
        const savedTilemapDir = currentWorkspace.savedPathManager.getTilemapDir();
        if (savedTilemapDir) {
            defaultDir = savedTilemapDir;
        } else {
            defaultDir = currentProject.projectPathSystem.absDir;
        }

        const tilemapAbsPath = await FileDialogUtils.saveFile({ title: i18n.t("dialog.save.tilemap.title"), defaultPath: defaultDir, filters: [{ name: "Tilemap", extensions: ["tm.json"] }] });
        if (!tilemapAbsPath) return;

        const tilemapDir = PathUtils.dirname(tilemapAbsPath);
        currentWorkspace.savedPathManager.setTilemapDir(tilemapDir);

        const tilemapData: TilemapData = {
            id: uuidv4(),
            name: form.name,
            orientation: "orthogonal", // TODO: Implement other orientations
            height: form.options.map.mapheight,
            width: form.options.map.mapwidth,
            tilewidth: form.options.tile.tilewidth,
            tileheight: form.options.tile.tileheight,
            tilesets: { refs: [], nextIndex: 0 },
            rulesets: { refs: [], nextIndex: 0 },
            layers: [],
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

        await editorContext.projectManager.saveCurrrentProject();

        WorkspaceService.createTilemapSession(tilemapData.id);
        
        Console.success({ message: "message.tilemap.createSuccess"});
    }

    public static async importTilemap(refTilemapId?: string): Promise<Result> {
        const tilemapAbsPath = await FileDialogUtils.open({ multiple: false, filters: [{ name: "Tilemap", extensions: ["tm.json"] }] });
        if (!tilemapAbsPath) return Result.Cancel();
        const loadTilemapResult = await TilemapStorageService.load(tilemapAbsPath);
        if (loadTilemapResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.tilemap.loadFail",
                stacks: loadTilemapResult.message ? [loadTilemapResult.message] : [],
            })
            return Result.Error(loadTilemapResult.message);
        }

        const tilemapData = loadTilemapResult.data;
        if (refTilemapId && tilemapData.id !== refTilemapId) {
            Console.error({
                message: "message.tilemap.importFail",
                stacks: [
                    "message.tilemap.mismatchId"
                ]
            });
            return Result.Cancel();
        }
        
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        await currentProject.tilemapManager.addTilemap(tilemapData, tilemapAbsPath);

        await editorContext.projectManager.saveCurrrentProject();

        WorkspaceService.createTilemapSession(tilemapData.id);
        
        Console.success({ message: "message.tilemap.importSuccess"});

        return Result.Success();
    }

    public static async removeTilemap(tilemapId: string): Promise<Result> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        const tilemapSession = currentWorkspace.tilemapSessionManager.getSessionByTilemapId(tilemapId);
        if (tilemapSession) await WorkspaceService.closeTilemapSession(tilemapSession.id);

        const removeResult = await currentProject.tilemapManager.removeTilemapMetadata(tilemapId);
        if (removeResult.status == Result.Status.Success) {
            await editorContext.projectManager.saveCurrrentProject();
        }
        return removeResult;
    }

    public static async deleteTilemap(tilemapId: string): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;
        
        if (!currentProject || !currentWorkspace) return;

        const confirm = await DialogService.openPermissionDialog({
            title: "dialog.delete.tilemap.title",
            description: "dialog.delete.tilemap.description",
        });

        if (!confirm) return;

        const tilemapSession = currentWorkspace.tilemapSessionManager.getSessionByTilemapId(tilemapId);
        if (tilemapSession) await WorkspaceService.closeTilemapSession(tilemapSession.id, true);

        await currentProject.tilemapManager.deleteTilemap(tilemapId);
        await editorContext.projectManager.saveCurrrentProject();
    }
}