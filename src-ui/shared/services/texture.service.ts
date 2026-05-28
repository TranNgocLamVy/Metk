import { appKernel } from "@/application/bootstrap/app-kernel";
import { Result } from "../types/result";
import { FileDialogUtils } from "../utils/file-dialog.utils";
import { readFile } from "@tauri-apps/plugin-fs";
import { TextureUtils } from "../utils/texture.utils";
import { Texture } from "pixi.js";
import { PathUtils } from "../utils/path.utils";
import { Console } from "./console.service";
import { DialogService } from "./dialog.service";
import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";

export class TextureService {
    public static async importTexture(tilesetId: string): Promise<Result> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

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

        const tilesetManager = appKernel.editorFacade.currentProject?.tilesetManager;
        if (!tilesetManager) return Result.Cancel();

        const tileset = tilesetManager.getTilesetById(tilesetId);
        if (!tileset || !(tileset instanceof SingleImageTileset)) return Result.Cancel();

        if (texture.width != tileset.imageSource.width || texture.height != tileset.imageSource.height) {
            const confirmTexture = await DialogService.openPermissionDialog({
                title: "dialog.import.textureMismatchSize.title",
                description: "dialog.import.textureMismatchSize.description",
            })
            if (!confirmTexture) return Result.Cancel();
        }

        const tilesetAbsDir = tileset.tilesetPathSystem.getFileAbsDir();
        const textureRelPath = PathUtils.relative(tilesetAbsDir, textureAbsPath);
        tileset.updateImageSource({ source: textureRelPath, width: texture.width, height: texture.height });
        tilesetManager.saveTileset(tilesetId);

        appKernel.textureManager.updateTilesetTexture(tileset, texture);

        Console.success({ message: "message.texture.importSuccess" })

        return Result.Success();
    }
}