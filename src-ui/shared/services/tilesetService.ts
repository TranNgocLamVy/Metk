import { v4 as uuidv4 } from "uuid";

import { appCore } from "@/core/appcore";
import { TilesetData, TilesetMetadata } from "@/shared/schema/tilesetSchema";

import { FileDialogUtils } from "../utils/fileDialogUtils";
import { PathUtils } from "../utils/pathUtils";
import { WorkspaceService } from "./workspaceService";
import { Result } from "../types/result";
import { TilesetStorageService } from "@/infrastructure/container";
import { DialogService } from "./dialogService";
import { createTilesetForm } from "../constant/form/createTilesetForm";
import i18n from "@/core/service/i18n";
import { Console } from "./consoleService";

export class TilesetService {
    public static async createTileset(): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;

        let defaultTextureDir: string;
        const savedTextureDir = currentWorkspace.savedPathManager.getTextureDir();
        if (savedTextureDir) {
            defaultTextureDir = savedTextureDir;
        } else {
            defaultTextureDir = currentProject.projectPathSystem.absDir;
        }

        const form = await DialogService.openFormDialog(createTilesetForm(defaultTextureDir));
        if (!form) return;

        let defaultTilesetDir: string;
        const savedTilesetDir = currentWorkspace.savedPathManager.getTilesetDir();
        if (savedTilesetDir) {
            defaultTilesetDir = savedTilesetDir;
        } else {
            defaultTilesetDir = currentProject.projectPathSystem.absDir;
        }

        const tilesetAbsPath = await FileDialogUtils.saveFile({ title: i18n.t("dialog.save.tileset.title"), defaultPath: defaultTilesetDir, filters: [{ name: "Tileset", extensions: ["ts.json"] }] });
        if (!tilesetAbsPath) return;
        const tilesetDir = PathUtils.dirname(tilesetAbsPath);

        const imageAbsPath = form.image.source[0];
        const imageRelPath = PathUtils.relative(tilesetDir, imageAbsPath);

        const tilesetData: TilesetData = {
            id: uuidv4(),
            name: form.tileset.name,
            columns: 0,
            rows: 0,
            image: {
                source: imageRelPath,
                width: 0,
                height: 0,
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

        const tilemapRelPath = PathUtils.relative(currentProject.projectPathSystem.absDir, tilesetAbsPath);
        const tilesetMetadata: TilesetMetadata = {
            id: tilesetData.id,
            name: tilesetData.name,
            tilesetRelPath: tilemapRelPath,
        }
        currentProject.tilesetManager.addTilesetMetadata(tilesetMetadata);
        await editorContext.projectManager.saveCurrrentProject();

        WorkspaceService.createTilesetSession(tilesetData.id);

        Console.success({ message: "message.tileset.createSucess" });
    }

    public static async editTileset(): Promise<void> {

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

        const tilesetSession = currentWorkspace.tilesetSessionManager.getSessionByTilesetId(tilesetId);
        if (tilesetSession) await WorkspaceService.closeTilesetSession(tilesetSession.id);

        const deleteResult = await currentProject.tilesetManager.deleteTileset(tilesetId);
        if (deleteResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.tileset.deleteFail",
                stacks: deleteResult.message ? [deleteResult.message] : [],
            })
            return;
        }

        await editorContext.projectManager.saveCurrrentProject();

        Console.log({ message: "message.tileset.deleteSuccess"});
    }
}