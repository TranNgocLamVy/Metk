import { v4 as uuidv4 } from "uuid";

import { AppCore } from "@/core/appcore";

import { TilemapData, TilemapMetadata } from "../schema/tilemapSchema";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { ToastService } from "./toastService";
import { Result } from "../types/result";
import { WorkspaceService } from "./workspaceService";
import { TilemapStorageService } from "@/infrastructure/container";
import { PathUtils } from "../utils/pathUtils";
import { DialogService } from "./dialogService";
import { createTilemapForm } from "../constant/form/createTilemapForm";

export class TilemapService {

    public static async createTilemap(): Promise<void> {
        const editorContext = AppCore.getIns().editorContext;
        const currentProject = editorContext.getCurrentProject();
        const form = await DialogService.openFormDialog(createTilemapForm);
        if (!form) return;

        const tilemapAbsPath = await FileDialogUtils.saveFile({ title: "Save Tilemap", filters: [{ name: "Tilemap", extensions: ["tm.json"] }] });
        if (!tilemapAbsPath) return;

        const tilemapData: TilemapData = {
            id: uuidv4(),
            name: form.name,
            height: form.options.map.mapheight,
            width: form.options.map.mapwidth,
            tilewidth: form.options.tile.tilewidth,
            tileheight: form.options.tile.tileheight,
            infinite: form.options.map.infinite,
            tilesets: [],
            rulesets: [],
            layers: [],
        }

        const saveResult = await TilemapStorageService.save(tilemapAbsPath, tilemapData);
        if (saveResult.status !== Result.Status.Success) {
            ToastService.error({ message: saveResult.message });
            return;
        }

        const tilemapRefPath = PathUtils.relative(currentProject.projectPathSystem.absDir, tilemapAbsPath);
        const tilemapMetadata: TilemapMetadata = {
            id: tilemapData.id,
            name: tilemapData.name,
            tilemapRelPath: tilemapRefPath,
        }
        currentProject.tilemapManager.addTilemapMetadata(tilemapMetadata);
        await editorContext.projectManager.saveCurrrentProject();

        WorkspaceService.createTilemapSession(tilemapData.id);
        
        ToastService.success({ message: "Tilemap created successfully" });

    }
}