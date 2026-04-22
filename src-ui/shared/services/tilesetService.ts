import { v4 as uuidv4 } from "uuid";

import { appCore } from "@/core/appcore";
import { TilesetData, TilesetMetadata } from "@/shared/schema/tilesetSchema";

import { FileDialogUtils } from "../utils/fileDialogUtils";
import { PathUtils } from "../utils/pathUtils";
import { ToastService } from "./toastService";
import { WorkspaceService } from "./workspaceService";
import { Result } from "../types/result";
import { TilesetStorageService } from "@/infrastructure/container";
import { DialogService } from "./dialogService";
import { createTilesetForm } from "../constant/form/createTilesetForm";

export class TilesetService {
    public static async createTileset(): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        if (!currentProject) return;
        
        const form = await DialogService.openFormDialog(createTilesetForm())
        if (!form) return;

        const tilesetAbsPath = await FileDialogUtils.saveFile({ title: "Save Tileset", filters: [{ name: "Tileset", extensions: ["ts.json"] }] });
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
            ToastService.error({ message: saveResult.message });
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

        ToastService.success({ message: "Tileset created successfully" });
    }

    public static async editViewTileset(): Promise<void> {

    }

    public static async deleteViewTileset(): Promise<void> {

    }
}