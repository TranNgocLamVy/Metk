import { AppCore } from "@/core/appcore";
import { createProjectForm } from "@/view/components/form/projectForm";
import { useProjectManagerStore } from "@/view/stores/application/projectManagerStore";

import { Result } from "../types/result";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { FormService } from "./formService";
import { TilemapService } from "./tilemapService";
import { TilesetService } from "./tilesetService";
import { ToastService } from "./toastService";
import { WorkspaceService } from "./workspaceService";

export class ProjectService {
    public static async loadProject(id: string): Promise<Result> {
        const result = await AppCore.getIns().projectManager.loadProject(id);
        if (result.status !== "Success") {
            ToastService.error({ message: result.message });
            return result;
        }
        useProjectManagerStore.getState().setCurrentProject(result.data)

        await TilesetService.loadTilesetView();
        await TilemapService.loadTilemapView();

        await WorkspaceService.loadWorkspace(result.data);

        return result;
    }

    public static async openProject(): Promise<void> {
        const projectAbsPath = await FileDialogUtils.open({ multiple: false, filters: [{ name: "Project", extensions: ["json"] }] });
        if (!projectAbsPath) return;
        const result = await AppCore.getIns().projectManager.openProject(projectAbsPath);
        if (result.status == "Success") {
            ProjectService.loadProject(result.data.metaData.id);
        }
    }

    public static async createProject(): Promise<void> {
        const form = await FormService.openFormDialog(createProjectForm);

        if (!form) return;

        const projectManager = AppCore.getIns().projectManager;
        const createProjectResult = await projectManager.createProject(form.name, form.destination);

        if (createProjectResult.status == "Success") {
            const newProject = createProjectResult.data;
            useProjectManagerStore.getState().addProject(newProject.metaData);
            ToastService.success({ message: "Project created successfully" });
            await ProjectService.loadProject(newProject.metaData.id);
        } else if (createProjectResult.status == "Error") {
            ToastService.error({ message: createProjectResult.message });
        }
    }
}