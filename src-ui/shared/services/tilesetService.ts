import { v4 as uuidv4 } from "uuid";

import { AppCore } from "@/core/appcore";
import { TilesetData, TilesetMetadata } from "@/shared/schema/tilesetSchema";
import { createTilesetForm } from "@/view/components/form/tilesetForm";
import { useExplorerStore } from "@/view/stores/application/explorerStore";

import { FileDialogUtils } from "../utils/fileDialogUtils";
import { PathUtils } from "../utils/pathUtils";
import { FormService } from "./formService";
import { ToastService } from "./toastService";
import { WorkspaceService } from "./workspaceService";
import { Result } from "../types/result";
import { TilesetStorageService } from "@/infrastructure/container";

export class TilesetService {
    public static async loadTilesetView(): Promise<void> {
        const editorContext = AppCore.getIns().editorContext;
        const project = editorContext.getCurrentProject();
        const tilesets = project.tilesetManager.serialize();
        useExplorerStore.getState().setTilesets(tilesets.map((tileset) => {
            return {
                id: tileset.id,
                name: tileset.name,
            }
        }));
    }

    public static async createTileset(): Promise<void> {
        const editorContext = AppCore.getIns().editorContext;
        const currentProject = editorContext.getCurrentProject();
        const form = await FormService.openFormDialog(createTilesetForm)
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

        // TODO: remove this section
        useExplorerStore.getState().addTileset({ name: tilesetData.name, id: tilesetData.id });

        ToastService.success({ message: "Tileset created successfully" });
    }

    public static async editViewTileset(): Promise<void> {

    }

    public static async deleteViewTileset(): Promise<void> {

    }
}