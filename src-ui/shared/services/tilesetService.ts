import { v4 as uuidv4 } from "uuid";

import { AppCore } from "@/core/appcore";
import { TilesetData } from "@/shared/schema/tilesetSchema";
import { createTilesetForm } from "@/view/components/form/tilesetForm";
import { useTilesetViewStore } from "@/view/stores/application/tilesetViewStore";

import { PathUtils } from "../utils/pathUtils";
import { DialogService } from "./dialogService";
import { ToastService } from "./toastService";

export class TilesetService {
    public static async loadTilesetView(): Promise<void> {
        const project = AppCore.getIns().getCurrentProject();
        const tilesets = await project.tilesetManager.getAllTilesets();
        useTilesetViewStore.getState().setTilesets(tilesets.map((tileset) => {
            return {
                id: tileset.id,
                name: tileset.name,
            }
        }));
    }

    public static async openViewTileset(id: string): Promise<void> {
        const project = AppCore.getIns().getCurrentProject();
        if (!project) return;
        project.tilesetManager.getTileset(id).then((tileset) => {
            if (!tileset) return;
            useTilesetViewStore.getState().setCurrentTileset(tileset);
        });
    }

    public static async createTileset(): Promise<void> {
        const currentProject = AppCore.getIns().projectManager.currentProject;
        if (!currentProject) return;
        const form = await DialogService.openFormDialog(createTilesetForm)
        if (!form) return;
        
        const imageAbsPath = form.image.source[0];

        const tilesetAbsPath = PathUtils.join(form.tileset.destination, form.tileset.name + ".ts.json");
        const tilesetDir = PathUtils.dirname(tilesetAbsPath);

        const imageRelPath = PathUtils.relative(tilesetDir, imageAbsPath);

        // console.log(PathUtils.join(tilesetDir, imageRelPath))
        

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
            tile: [],
            tilewidth: form.image.setting.tile.tilewidth,
            tileheight: form.image.setting.tile.tileheight,
        }

        const createTilesetResult = await currentProject.createTileset(tilesetData, tilesetAbsPath);

        if (createTilesetResult.status === "Success") {
            const newTileset = createTilesetResult.data;
            useTilesetViewStore.getState().addTileset({ name: newTileset.name, id: newTileset.id });
            TilesetService.openViewTileset(newTileset.id);
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