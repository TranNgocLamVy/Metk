import { v4 as uuidv4 } from "uuid";

import { appCore } from "@/core/appcore";

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
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;
        if (!currentProject || !currentWorkspace) return;
        
        const form = await DialogService.openFormDialog(createTilemapForm());
        if (!form) return;
        
        let defaultDir: string;
        const savedTilemapDir = currentWorkspace.savedPathManager.getTilemapDir();
        if (savedTilemapDir) {
            defaultDir = savedTilemapDir;
        } else {
            defaultDir = currentProject.projectPathSystem.absDir;
        }

        const tilemapAbsPath = await FileDialogUtils.saveFile({ title: "Save Tilemap", defaultPath: defaultDir, filters: [{ name: "Tilemap", extensions: ["tm.json"] }] });
        if (!tilemapAbsPath) return;

        const tilemapDir = PathUtils.dirname(tilemapAbsPath);
        currentWorkspace.savedPathManager.setTilemapDir(tilemapDir);

        const tilemapData: TilemapData = {
            id: uuidv4(),
            name: form.name,
            orientation: "orthogonal", // TODO: Implement other orientations
            height: form.options.map.mapheight,
            width: form.options.map.mapwidth,
            tilewidth: form.options.tile.tilewidth,
            tileheight: form.options.tile.tileheight,
            tilesets: { refs: [], nextIndex: 0 },
            rulesets: { refs: [], nextIndex: 0 },
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

    public static async deleteTilemap(tilemapId: string): Promise<void> {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        const currentWorkspace = editorContext.currentWorkspace;
        
        if (!currentProject || !currentWorkspace) return;

        const confirm = await DialogService.openPermissionDialog({
            title: "Delete Tilemap", // TODO: i18n
            description: "Are you sure you want to delete this tilemap? This action will permanently remove the file and cannot be undone."
        });

        if (!confirm) return;

        const tilemapSession = currentWorkspace.tilemapSessionManager.getSessionByTilemapId(tilemapId);
        if (tilemapSession) await WorkspaceService.closeTilemapSession(tilemapSession.id, true);

        const deleteResult = await currentProject.tilemapManager.deleteTilemap(tilemapId);
        if (deleteResult.status !== Result.Status.Success) {
            ToastService.error({ message: deleteResult.message });
            return;
        }

        await editorContext.projectManager.saveCurrrentProject();
        ToastService.success({ message: "Tilemap deleted successfully" });
    }
}