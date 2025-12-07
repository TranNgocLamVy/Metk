import { v4 as uuidv4 } from "uuid";

import { AppCore } from "@/core/appcore";
import { TilesetData } from "@/shared/schema/tilesetSchema";
import { createTilesetForm } from "@/view/components/form/tilesetForm";
import { useTilesetViewStore } from "@/view/stores/application/tilesetViewStore";

import { FileDialogUtils } from "../utils/fileDialogUtils";
import { PathUtils } from "../utils/pathUtils";
import { FormService } from "./formService";
import { ToastService } from "./toastService";

export class TilesetService {
    public static async loadTilesetView(): Promise<void> {
        const project = AppCore.getIns().getCurrentProject();
        const tilesets = project.tilesetManager.getAllTilesets();
        useTilesetViewStore.getState().setTilesets(tilesets.map((tileset) => {
            return {
                id: tileset.id,
                name: tileset.name,
            }
        }));
    }

    public static async openTilesetView(id: string): Promise<void> {
        const project = AppCore.getIns().getCurrentProject();
        const tilesetFindResult = await project.tilesetManager.getTilesetById(id)
        if (tilesetFindResult.status == "Success") {
            const tileset = tilesetFindResult.data;
            useTilesetViewStore.getState().setCurrentTileset(tileset);
        } else {
            ToastService.error({ message: tilesetFindResult.message });
        }
    }

    public static async createTileset(): Promise<void> {
        const currentProject = AppCore.getIns().getCurrentProject();
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

        const createTilesetResult = await currentProject.createTileset(tilesetData, tilesetAbsPath);

        if (createTilesetResult.status === "Success") {
            const newTileset = createTilesetResult.data;
            useTilesetViewStore.getState().addTileset({ name: newTileset.name, id: newTileset.id });
            TilesetService.openTilesetView(newTileset.id);
            ToastService.success({ message: "Tileset created successfully" });
        } else if (createTilesetResult.status === "Error") {
            ToastService.error({ message: createTilesetResult.message });
        }
    }

    public static async editViewTileset(): Promise<void> {

    }

    public static async deleteViewTileset(): Promise<void> {

    }
}