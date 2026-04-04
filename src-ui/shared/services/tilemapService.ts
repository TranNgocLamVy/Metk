import { v4 as uuidv4 } from "uuid";

import { AppCore } from "@/core/appcore";
import { createTilemapForm } from "@/view/components/form/tilemapForm";
import { useExplorerStore } from "@/view/stores/application/explorerStore";

import { TilemapData, TilemapMetadata } from "../schema/tilemapSchema";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { FormService } from "./formService";
import { ToastService } from "./toastService";
import { Result } from "../types/result";
import { WorkspaceService } from "./workspaceService";
import { TilemapStorageService } from "@/infrastructure/container";
import { PathUtils } from "../utils/pathUtils";

export class TilemapService {
    public static async loadTilemapEditor(): Promise<void> {
        const editorContext = AppCore.getIns().editorContext;
        const project = editorContext.getCurrentProject();
        const tilemapsMetadata = project.tilemapManager.serialize();
        useExplorerStore.getState().setTilemaps(tilemapsMetadata.map((tilemap) => {
            return {
                id: tilemap.id,
                name: tilemap.name,
            }
        }));
    }

    public static async createTilemap(): Promise<void> {
        const editorContext = AppCore.getIns().editorContext;
        const currentProject = editorContext.getCurrentProject();
        const form = await FormService.openFormDialog(createTilemapForm);
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
        
        // TODO: remove this section in the future
        useExplorerStore.getState().addTilemap({ name: tilemapMetadata.name, id: tilemapMetadata.id });

        ToastService.success({ message: "Tilemap created successfully" });

    }
}