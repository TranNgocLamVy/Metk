import { AppCore } from "@/core/appcore";
import { Project } from "@/core/application/project";
import { useTilesetViewStore } from "@/view/stores/application/tilesetViewStore";

import { ToastService } from "./toastService";

export class WorkspaceService {
    public static async loadWorkspace(project: Project): Promise<void> {
        const result = await AppCore.getIns().workspaceManager.loadProjectWorkspace(project);
        if (result.status !== "Success") {
            ToastService.error({ message: result.message });
            return;
        }
    }

    public static async saveWorkspace(project: Project): Promise<void> {

    }

    public static async openTilesetViewSesion(sessionId: string): Promise<void> {
        const result = await AppCore.getCurrentWorkspace().openTilesetViewSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetViewStore.getState().setCurrentTilesetViewSesison(result.data);
    }

    public static async createTilesetViewSession(tilesetId: string): Promise<void> {
        const tileset = await AppCore.getCurrentProject().tilesetManager.getTilesetById(tilesetId);
        if (tileset.status !== "Success" || !tileset.data) {
            console.error(tileset.message);
            ToastService.error({ message: tileset.message });
            return;
        }
        const result = await AppCore.getCurrentWorkspace().createTilesetViewSession(tilesetId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetViewStore.getState().addTilesetViewSession({ name: result.data.tileset.name, sessionId: result.data.id });
        useTilesetViewStore.getState().setCurrentTilesetViewSesison(result.data);
    }
}