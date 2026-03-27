import { AppCore } from "@/core/appcore";
import { createProjectForm } from "@/view/components/form/projectForm";
import { useProjectManagerStore } from "@/view/stores/application/projectManagerStore";

import { FileDialogUtils } from "../utils/fileDialogUtils";
import { FormService } from "./formService";
import { ToastService } from "./toastService";
import { WorkspaceService } from "./workspaceService";

export class ProjectService {

    public static async openProject(): Promise<void> {
        const projectAbsPath = await FileDialogUtils.open({ multiple: false, filters: [{ name: "Project", extensions: ["json"] }] });
        if (!projectAbsPath) return;
        const result = await AppCore.getIns().projectManager.openProject(projectAbsPath);
        if (result.status == "Success") {
            WorkspaceService.loadProjectWorkspace(result.data.metaData.id);
        }
    }

    public static async createProject(): Promise<void> {
        const form = await FormService.openFormDialog(createProjectForm);

        if (!form) return;

        const projectManager = AppCore.getIns().projectManager;
        const createProjectResult = await projectManager.createProject(form.name, form.destination);

        if (createProjectResult.status == "Success") {
            const newProject = createProjectResult.data;
            useProjectManagerStore.getState().refresh();
            ToastService.success({ message: "Project created successfully" });
            await WorkspaceService.loadProjectWorkspace(newProject.id);
        } else if (createProjectResult.status == "Error") {
            ToastService.error({ message: createProjectResult.message });
        }
    }
}