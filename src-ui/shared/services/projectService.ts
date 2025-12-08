import { AppCore } from "@/core/appcore";
import { createProjectForm } from "@/view/components/form/projectForm";
import { useProjectManagerStore } from "@/view/stores/application/projectManagerStore";
import { useNavigationStore } from "@/view/stores/menu/navigationStore";

import { Result } from "../types/result";
import { FileDialogUtils } from "../utils/fileDialogUtils";
import { FormService } from "./formService";
import { TilesetService } from "./tilesetService";
import { ToastService } from "./toastService";

export class ProjectService {
    public static async loadProject(id: string): Promise<Result> {
        const result = await AppCore.getIns().projectManager.loadProject(id);
        if (result.status == "Success") {
            await TilesetService.loadTilesetView();
            useProjectManagerStore.getState().setCurrentProject(result.data);
            useNavigationStore.getState().navigate?.("/project/" + id);
        } else {
            ToastService.error({ message: result.message });
        }
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