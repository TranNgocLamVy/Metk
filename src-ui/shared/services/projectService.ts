import { AppCore } from "@/core/appcore";
import { createProjectForm } from "@/view/components/form/projectForm";
import { useProjectManagerStore } from "@/view/stores/application/projectManagerStore";

import { FileDialogUtils } from "../utils/fileDialogUtils";
import { FormService } from "./formService";
import { ToastService } from "./toastService";
import { Result } from "../types/result";
import { ProjectStorageService, TauriFileStorage } from "@/infrastructure/container";
import { defaultProjectData } from "../schema/projectSchema";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { Project } from "@/core/application/project";
import { DialogService } from "./dialogService";
import { useNavigationStore } from "@/view/stores/menu/navigationStore";
import { PathUtils } from "../utils/pathUtils";

export class ProjectService {

    public static async openNewProject(): Promise<void> {
        const projectAbsPath = await FileDialogUtils.open({ multiple: false, filters: [{ name: "Project", extensions: ["json"] }] });
        if (!projectAbsPath) return;
        const projectDataResult = await ProjectStorageService.load(projectAbsPath);
        if (projectDataResult.status !== Result.Status.Success) {
            ToastService.error({ message: projectDataResult.message });
            return;
        }
        const projectData = projectDataResult.data;
        const projectAbsDir = PathUtils.dirname(projectAbsPath);
        const project = new Project(projectData, new ProjectPathSystem(projectAbsDir));

        const projectManager = AppCore.getIns().projectManager;
        projectManager.addProjectMetaData(project.metaData);
        await AppCore.getIns().saveProjectManager();

        const openProject = await DialogService.openPermissionDialog({ title: "Project opened successfully", description: "Do you want to open this project?" })

        if (openProject) useNavigationStore.getState().navigate!(`/project/${project.id}`);
        useProjectManagerStore.getState().refresh();
    }

    public static async createProject(): Promise<void> {
        const form = await FormService.openFormDialog(createProjectForm);

        if (!form) return;

        const mkdirResult = await TauriFileStorage.mkdir(form.destination);
        if (mkdirResult.status !== Result.Status.Success) {
            ToastService.error({ message: mkdirResult.message });
            return;
        }

        const projectData = defaultProjectData({ name: form.name });
        const project = new Project(projectData, new ProjectPathSystem(form.destination));

        const projectAbsPath = project.projectPathSystem.getAbsPathFromRelPath("project.json");
        const saveResult = await ProjectStorageService.save(projectAbsPath, project.serialize());
        if (saveResult.status !== Result.Status.Success) {
            ToastService.error({ message: saveResult.message });
            return;
        }

        const projectManager = AppCore.getIns().projectManager;
        projectManager.addProjectMetaData(project.metaData);
        await AppCore.getIns().saveProjectManager();

        const openProject = await DialogService.openPermissionDialog({ title: "Project created successfully", description: "Do you want to open the project?" })

        if (openProject) useNavigationStore.getState().navigate!(`/project/${project.id}`);
        useProjectManagerStore.getState().refresh();
    }
}