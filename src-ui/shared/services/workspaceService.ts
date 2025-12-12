import { AppCore } from "@/core/appcore";
import { Project } from "@/core/application/project";
import { useTilesetSessionStore } from "@/view/stores/application/tilesetSessionStore";

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
        const result = await AppCore.getCurrentWorkspace().openTilesetSession(sessionId);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().setCurrentTilesetViewSesison(result.data);
    }

    public static async createTilesetSession(tilesetId: string): Promise<void> {
        const tilesetResult = await AppCore.getCurrentProject().tilesetManager.getTilesetById(tilesetId);
        if (tilesetResult.status !== "Success" || !tilesetResult.data) {
            console.error(tilesetResult.message);
            ToastService.error({ message: tilesetResult.message });
            return;
        }
        const tileset = tilesetResult.data;
        const result = await AppCore.getCurrentWorkspace().createTilesetSession(tileset);
        if (result.status !== "Success" || !result.data) {
            ToastService.error({ message: result.message });
            return;
        }
        useTilesetSessionStore.getState().addTilesetSession({ name: tileset.name, sessionId: result.data.id });
        useTilesetSessionStore.getState().setCurrentTilesetViewSesison(result.data);
    }
}