import { appCore } from "@/editor/appcore";
import { Result } from "../types/result";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { readFile } from "@tauri-apps/plugin-fs";
import { TextureUtils } from "../utils/textureUtils";
import { Texture } from "pixi.js";
import { PathUtils } from "../utils/pathUtils";
import { Console } from "./consoleService";
import { DialogService } from "./dialogService";

export class TextureService {
    public static async importTexture(tilesetId: string): Promise<Result> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;

        if (!currentProject || !currentWorkspace) return Result.Cancel();

        const defaultTextureDir = currentWorkspace.savedPathManager.getTextureDir();

        const textureAbsPath = await FileDialogUtils.open({ defaultPath: defaultTextureDir, multiple: false, filters: [{ name: "Texture", extensions: ["png", "jpg", "jpeg"] }] });
        if (!textureAbsPath) return Result.Cancel();

        const buffer = await readFile(textureAbsPath);
        let texture: Texture;
        try {
            texture = await TextureUtils.processTexture(buffer);
        } catch (error) {
            return Result.Error("message.texture.importFail", Result.Error((error as any).message));
        }

        const textureAbsDir = PathUtils.dirname(textureAbsPath);
        currentWorkspace.savedPathManager.setTextureDir(textureAbsDir);

        const tilesetManager = appCore.editorContext.currentProject?.tilesetManager;
        if (!tilesetManager) return Result.Cancel();

        const tileset = tilesetManager.getTilesetById(tilesetId);
        if (!tileset) return Result.Cancel();

        if (texture.width != tileset.image.width || texture.height != tileset.image.height) {
            const confirmTexture = await DialogService.openPermissionDialog({
                title: "dialog.import.textureMismatchSize.title",
                description: "dialog.import.textureMismatchSize.description",
            })
            if (!confirmTexture) return Result.Cancel();
        }

        const tilesetAbsDir = tileset.tilesetPathSystem.getFileAbsDir();
        const textureRelPath = PathUtils.relative(tilesetAbsDir, textureAbsPath);
        tileset.updateTexturePath(textureRelPath);
        tilesetManager.saveTileset(tilesetId);

        appCore.textureManager.updateTilesetTexture(tileset, texture);

        Console.success({ message: "message.texture.importSuccess" })

        return Result.Success();
    }
}