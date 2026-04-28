import { v4 as uuidv4 } from "uuid";

import { appCore } from "@/core/appcore";
import { TilesetData } from "@/shared/schema/tilesetSchema";

import { FileDialogUtils } from "../utils/fileDialogUtils";
import { PathUtils } from "../utils/pathUtils";
import { WorkspaceService } from "./workspaceService";
import { Result } from "../types/result";
import { TilesetStorageService } from "@/infrastructure/container";
import { DialogService } from "./dialogService";
import { createTilesetForm } from "../constant/form/createTilesetForm";
import i18n from "@/core/service/i18n";
import { Console } from "./consoleService";
import { readFile } from "@tauri-apps/plugin-fs";
import { TextureUtils } from "../utils/textureUtils";

export class TilesetService {
    public static async createTileset(): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;

        const defaultTextureDir = currentWorkspace.savedPathManager.getTextureDir();

        const form = await DialogService.openFormDialog(createTilesetForm(defaultTextureDir));
        if (!form) return;

        const defaultTilesetDir = currentWorkspace.savedPathManager.getTilesetDir();

        const tilesetAbsPath = await FileDialogUtils.saveFile({ title: i18n.t("dialog.save.tileset.title"), defaultPath: defaultTilesetDir, filters: [{ name: "Tileset", extensions: ["ts.json"] }] });
        if (!tilesetAbsPath) return;

        const imageAbsPath = form.image.source[0];
        if (!imageAbsPath) return;

        const tilesetAbsDir = PathUtils.dirname(tilesetAbsPath);
        currentWorkspace.savedPathManager.setTilesetDir(tilesetAbsDir);

        const imageAbsDir = PathUtils.dirname(imageAbsPath);
        currentWorkspace.savedPathManager.setTextureDir(imageAbsDir);

        const imageRelPath = PathUtils.relative(tilesetAbsDir, imageAbsPath);

        const fileBuffer = await readFile(imageAbsPath); // TODO: move readFile to infrastructure;
        const image = await TextureUtils.processImage(fileBuffer);
        const columns = Math.ceil(image.width / form.image.setting.tile.tilewidth);
        const rows = Math.ceil(image.height / form.image.setting.tile.tileheight);

        const tilesetData: TilesetData = {
            id: uuidv4(),
            name: form.tileset.name,
            columns: columns,
            rows: rows,
            image: {
                source: imageRelPath,
                width: image.width,
                height: image.height,
            },
            tiles: [],
            tilewidth: form.image.setting.tile.tilewidth,
            tileheight: form.image.setting.tile.tileheight,
        }

        const saveResult = await TilesetStorageService.save(tilesetAbsPath, tilesetData);
        if (saveResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.tileset.saveFail",
                stacks: saveResult.message ? [saveResult.message] : [],
            })
            return;
        }

        await currentProject.tilesetManager.addTileset(tilesetData, tilesetAbsPath);
        await editorContext.projectManager.saveCurrrentProject();

        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        await WorkspaceService.createTilesetSession(tilesetData.id);

        Console.success({ message: "message.tileset.createSuccess" });
    }

    public static async importTileset(refTilesetId?: string): Promise<Result> {
        const rulesetAbsPath = await FileDialogUtils.open({ multiple: false, filters: [{ name: "Tileset", extensions: ["ts.json"] }] });
        if (!rulesetAbsPath) return Result.Cancel();
        const loadTilesetResult = await TilesetStorageService.load(rulesetAbsPath);
        if (loadTilesetResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.tileset.importFail",
                stacks: ["message.tileset.loadFail", loadTilesetResult.message!, ...loadTilesetResult.stacks!]
            })
            return Result.Error(loadTilesetResult.message);
        }

        const tilesetData = loadTilesetResult.data;
        if (refTilesetId && tilesetData.id !== refTilesetId) {
            Console.error({
                message: "message.tileset.importFail",
                stacks: ["message.tileset.mismatchId"]
            });
            return Result.Cancel();
        }

        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        await currentProject.tilesetManager.addTileset(tilesetData, rulesetAbsPath);

        await editorContext.projectManager.saveCurrrentProject();

        WorkspaceService.createTilesetSession(tilesetData.id);

        Console.success({ message: "message.tileset.importSuccess" });

        return Result.Success();
    }

    public static async removeTileset(tilesetId: string): Promise<Result> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;

        if (!currentProject) return Result.Cancel();

        const confirmRemoval = await DialogService.openPermissionDialog({
            title: "dialog.remove.tileset.title",
            description: "dialog.remove.tileset.description",
        });
        if (!confirmRemoval) return Result.Cancel();

        const removeResult = await currentProject.tilesetManager.removeTileset(tilesetId);

        await Promise.all([
            currentProject.tilemapManager.removeTilesetRef(tilesetId),
            currentProject.rulesetManager.removeTilesetRef(tilesetId)
        ])

        appCore.textureManager.forceUnloadTexture(tilesetId);

        if (removeResult.status !== Result.Status.Success) return Result.Cancel();

        await editorContext.projectManager.saveCurrrentProject();

        const tilesetSession = editorContext.currentWorkspace?.tilesetSessionManager.getSessionByTilesetId(tilesetId);
        if (tilesetSession) {
            await WorkspaceService.closeTilesetSession(tilesetSession.id);
            await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }

        return removeResult;
    }

    public static async deleteTileset(tilesetId: string): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;

        if (!currentProject || !currentWorkspace) return;

        const confirm = await DialogService.openPermissionDialog({
            title: "dialog.delete.tileset.title",
            description: "dialog.delete.tileset.description",
        });

        if (!confirm) return;

        const deleteResult = await currentProject.tilesetManager.deleteTileset(tilesetId);

        await Promise.all([
            currentProject.tilemapManager.removeTilesetRef(tilesetId),
            currentProject.rulesetManager.removeTilesetRef(tilesetId),
        ])

        appCore.textureManager.forceUnloadTexture(tilesetId);

        if (deleteResult.status !== Result.Status.Success) return;

        await editorContext.projectManager.saveCurrrentProject();

        const tilesetSession = currentWorkspace.tilesetSessionManager.getSessionByTilesetId(tilesetId);
        if (tilesetSession) await WorkspaceService.closeTilesetSession(tilesetSession.id);
    }
}