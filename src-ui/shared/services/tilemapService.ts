import { v4 as uuidv4 } from "uuid";

import { AppCore } from "@/core/appcore";
import { createTilemapForm } from "@/view/components/form/tilemapForm";
import { useExplorerStore } from "@/view/stores/application/explorerStore";

import { TilemapData } from "../schema/tilemapSchema";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { FormService } from "./formService";
import { ToastService } from "./toastService";

export class TilemapService {
    public static async loadTilemapView(): Promise<void> {
        const project = AppCore.getIns().editorContext.getCurrentProject();
        const tilemaps = project.tilemapManager.getAllTilemaps();
        useExplorerStore.getState().setTilemaps(tilemaps.map((tilemap) => {
            return {
                id: tilemap.id,
                name: tilemap.name,
            }
        }));
    }

    public static async createTilemap(): Promise<void> {
        const currentProject = AppCore.getIns().editorContext.getCurrentProject();
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

        if (createTilesetResult.status === "Success") {
            const newTilemap = createTilesetResult.data;
            useExplorerStore.getState().addTilemap({ name: newTilemap.name, id: newTilemap.id });
            ToastService.success({ message: "Tilemap created successfully" });
        } else if (createTilesetResult.status === "Error") {
            ToastService.error({ message: createTilesetResult.message });
        }
    }
}