import { v4 as uuidv4 } from "uuid";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { TilesetData, TilesetType } from "@/shared/data-types/tileset.data";

import { FileDialogUtils } from "../utils/file-dialog.utils";
import { PathUtils } from "../utils/path.utils";
import { WorkspaceService } from "./workspace.service";
import { Result } from "../types/result";
import { TilesetStorageService } from "@/infrastructure/container";
import { DialogService } from "./dialog.service";
import { createTilesetForm } from "../constant/form/create-tileset.form";
import i18n from "@/shared/services/i18n.service";
import { Console } from "./console.service";
import { readFile } from "@tauri-apps/plugin-fs";
import { TextureUtils } from "../utils/texture.utils";
import { extractTilesetId } from "@/editor/model/tileset/tileset.normalizer";

export class TilesetService {
    public static async createTileset(): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;

        const defaultTextureDir = currentWorkspace.savedPathManager.getTextureDir();

        const form = await DialogService.openFormDialog(createTilesetForm(defaultTextureDir));
        if (!form) return;

        const defaultTilesetDir = currentWorkspace.savedPathManager.getTilesetDir();

        const tilesetAbsPath = await FileDialogUtils.saveFile({ title: i18n.t("dialog.save.tileset.title"), defaultPath: defaultTilesetDir, filters: [{ name: "Tileset", extensions: ["ts.json"] }] });
        if (!tilesetAbsPath) return;

        const tilesetAbsDir = PathUtils.dirname(tilesetAbsPath);
        currentWorkspace.savedPathManager.setTilesetDir(tilesetAbsDir);

        let tilesetData: TilesetData;

        if (form.tileset.type == TilesetType.SingleImage) {
            const textureAbsPath = form.image.source[0];
            if (!textureAbsPath) return;

            const textureAbsDir = PathUtils.dirname(textureAbsPath);
            currentWorkspace.savedPathManager.setTextureDir(textureAbsDir);
            tilesetData = await TilesetService.createSingleImageTilesetData({
                name: form.tileset.name,
                tilesetAbsDir,
                textureAbsPath,
                tilewidth: form.image.setting.tile.tilewidth,
                tileheight: form.image.setting.tile.tileheight,
            })
        } else {
            tilesetData = await TilesetService.createImageCollectionTilesetData({
                name: form.tileset.name,
                tilesetAbsDir,
            })
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
        await editorFacade.projectManager.saveCurrrentProject();

        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        await WorkspaceService.createTilesetSession(tilesetData.id);

        Console.success({ message: "message.tileset.createSuccess" });
    }

    private static async createSingleImageTilesetData(args: { name: string; tilesetAbsDir: string; textureAbsPath: string; tilewidth: number; tileheight: number }): Promise<TilesetData> {
        const fileBuffer = await readFile(args.textureAbsPath);
        const image = await TextureUtils.processImage(fileBuffer);

        const columns = Math.ceil(image.width / args.tilewidth);
        const rows = Math.ceil(image.height / args.tileheight);

        return {
            id: uuidv4(),
            name: args.name,
            type: "single-image",
            columns,
            rows,
            image: {
                source: PathUtils.relative(args.tilesetAbsDir, args.textureAbsPath),
                width: image.width,
                height: image.height,
            },
            tiles: [],
            tilewidth: args.tilewidth,
            tileheight: args.tileheight,
        };
    }

    private static async createImageCollectionTilesetData(args: { name: string; tilesetAbsDir: string }): Promise<TilesetData> {
        return {
            id: uuidv4(),
            name: args.name,
            type: "image-collection",
            columns: 0,
            rows: 0,
            tilewidth: 1,
            tileheight: 1,
            tiles: [],
        };
    }

    public static async importTileset(refTilesetId?: string): Promise<Result> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        const defaultTilesetDir = currentWorkspace.savedPathManager.getTilesetDir();

        const tilesetAbsPath = await FileDialogUtils.open({ defaultPath: defaultTilesetDir, multiple: false, filters: [{ name: "Tileset", extensions: ["ts.json"] }] });
        if (!tilesetAbsPath) return Result.Cancel();

        const loadTilesetResult = await TilesetStorageService.load(tilesetAbsPath);
        if (loadTilesetResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.tileset.importFail",
                stacks: ["message.tileset.loadFail", loadTilesetResult.message!, ...loadTilesetResult.stacks!]
            })
            return Result.Error(loadTilesetResult.message);
        }

        const tilesetAbsDir = PathUtils.dirname(tilesetAbsPath);
        currentWorkspace.savedPathManager.setTilesetDir(tilesetAbsDir);

        let tilesetId: string;
        try {
            tilesetId = extractTilesetId(loadTilesetResult.data);
        } catch (error) {
            Console.error({
                message: "message.tileset.importFail",
                stacks: [String(error)],
            });
            return Result.Error("message.tileset.importFail");
        }

        if (refTilesetId && tilesetId !== refTilesetId) {
            Console.error({
                message: "message.tileset.importFail",
                stacks: ["message.tileset.mismatchId"]
            });
            return Result.Cancel();
        }

        const addTilesetResult = await currentProject.tilesetManager.addTileset(loadTilesetResult.data, tilesetAbsPath);
        if (addTilesetResult.status !== Result.Status.Success) return addTilesetResult;

        await editorFacade.projectManager.saveCurrrentProject();

        WorkspaceService.createTilesetSession(addTilesetResult.data.id);

        Console.success({ message: { key: "message.tileset.importSuccess", options: { name: addTilesetResult.data.name } } });

        return Result.Success();
    }

    public static async removeTileset(tilesetId: string): Promise<Result> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;

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

        appKernel.textureManager.forceUnloadTexture(tilesetId);

        if (removeResult.status !== Result.Status.Success) return Result.Cancel();

        await editorFacade.projectManager.saveCurrrentProject();

        const tilesetSession = editorFacade.currentWorkspace?.tilesetSessionManager.getSessionByTilesetId(tilesetId);
        if (tilesetSession) {
            await WorkspaceService.closeTilesetSession(tilesetSession.id);
            await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }

        return removeResult;
    }

    public static async deleteTileset(tilesetId: string): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

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

        appKernel.textureManager.forceUnloadTexture(tilesetId);

        if (deleteResult.status !== Result.Status.Success) return;

        await editorFacade.projectManager.saveCurrrentProject();

        const tilesetSession = currentWorkspace.tilesetSessionManager.getSessionByTilesetId(tilesetId);
        if (tilesetSession) await WorkspaceService.closeTilesetSession(tilesetSession.id);
    }
}
