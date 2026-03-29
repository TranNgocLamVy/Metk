import { v4 as uuidv4 } from "uuid";

import { AppCore } from "@/core/appcore";
import { createTilemapForm } from "@/view/components/form/tilemapForm";
import { useExplorerStore } from "@/view/stores/application/explorerStore";

import { TilemapData } from "../schema/tilemapSchema";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { FormService } from "./formService";
import { ToastService } from "./toastService";
import { Result } from "../types/result";
import { WorkspaceService } from "./workspaceService";

export class TilemapService {
    public static async loadTilemapView(): Promise<void> {
        const editorContext = AppCore.getIns().editorContext;
        const project = editorContext.getCurrentProject();
        const tilemaps = project.tilemapManager.getAllTilemaps();
        useExplorerStore.getState().setTilemaps(tilemaps.map((tilemap) => {
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
            tileset: [],
            layers: [],
        }

        const createTilesetResult = await currentProject.createTilemap(tilemapData, tilemapAbsPath);
        if (createTilesetResult.status !== Result.Status.Success) {
            ToastService.error({ message: createTilesetResult.message });
            return;
        }

        const saveResult = await editorContext.projectManager.saveCurrrentProject();
        if (saveResult.status !== Result.Status.Success) {
            ToastService.error({ message: saveResult.message });
            //TODO: remove tilemap
            return;
        }
        const newTilemap = createTilesetResult.data;
        WorkspaceService.createTilemapSession(newTilemap.id);
        
        // TODO: remove this section
        useExplorerStore.getState().addTilemap({ name: newTilemap.name, id: newTilemap.id });

        ToastService.success({ message: "Tilemap created successfully" });

    }
}