import { appCore } from "@/core/appcore";
import { useProjectManagerStore } from "@/view/stores/projectManagerStore";

import { FileDialogUtils } from "../utils/fileDialogUtils";
import { ToastService } from "./toastService";
import { Result } from "../types/result";
import { ProjectStorageService, TauriFileStorage } from "@/infrastructure/container";
import { defaultProjectData } from "../schema/projectSchema";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { Project } from "@/core/application/project";
import { DialogService } from "./dialogService";
import { useNavigationStore } from "@/view/stores/navigationStore";
import { PathUtils } from "../utils/pathUtils";
import { createProjectForm } from "../constant/form/createProjectForm";

export class ProjectService {

    public static async importProject(): Promise<void> {
        const projectAbsPath = await FileDialogUtils.open({ multiple: false, filters: [{ name: "Project", extensions: ["json"] }] });
        if (!projectAbsPath) return;
        const projectDataResult = await ProjectStorageService.load(projectAbsPath);
        if (projectDataResult.status !== Result.Status.Success) {
            ToastService.error({ message: projectDataResult.message });
            return;
        }
        const projectData = projectDataResult.data;
        const metkDir = PathUtils.dirname(projectAbsPath);
        const projectAbsDir = PathUtils.dirname(metkDir);
        const project = new Project(projectData, new ProjectPathSystem(projectAbsDir));

        const projectManager = appCore.projectManager;
        projectManager.addProjectMetadata(project.metaData);
        await appCore.saveProjectManager();

        const openProject = await DialogService.openPermissionDialog({ title: "Project opened successfully", description: "Do you want to open this project?" })

        if (openProject) useNavigationStore.getState().navigate!(`/project/${project.id}`);
        useProjectManagerStore.getState().refresh();
    }

    public static async createProject(): Promise<void> {
        const form = await DialogService.openFormDialog(createProjectForm());

        if (!form) return;

        const projectAbsDir = PathUtils.join(form.destination, form.name);
        const metkDir = PathUtils.join(projectAbsDir, ".metk");

        const mkdirResult = await TauriFileStorage.mkdir(projectAbsDir);
        if (mkdirResult.status !== Result.Status.Success) {
            ToastService.error({ message: mkdirResult.message });
            return;
        }

        const mkdirMetkResult = await TauriFileStorage.mkdir(metkDir);
        if (mkdirMetkResult.status !== Result.Status.Success) {
            ToastService.error({ message: mkdirMetkResult.message });
            return;
        }

        const projectData = defaultProjectData({ name: form.name });
        const project = new Project(projectData, new ProjectPathSystem(projectAbsDir));

        const projectAbsPath = project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "project.json"));
        const saveResult = await ProjectStorageService.save(projectAbsPath, project.serialize());
        if (saveResult.status !== Result.Status.Success) {
            ToastService.error({ message: saveResult.message });
            return;
        }

        const projectManager = appCore.projectManager;
        projectManager.addProjectMetadata(project.metaData);
        await appCore.saveProjectManager();

        const openProject = await DialogService.openPermissionDialog({ title: "Project created successfully", description: "Do you want to open the project?" })

        if (openProject) useNavigationStore.getState().navigate!(`/project/${project.id}`);
        useProjectManagerStore.getState().refresh();
    }

    public static async removeProject(projectId: string): Promise<void> {
        const confirm = await DialogService.openPermissionDialog({
            title: "Remove Project", // TODO: i18n
            description: "Are you sure you want to remove this project?"
        });

        if (!confirm) return;

        const projectManager = appCore.projectManager;
        projectManager.removeProjectMetadata(projectId);
        await appCore.saveProjectManager();
        useProjectManagerStore.getState().refresh();
    }
}