import { appKernel } from "@/application/bootstrap/app-kernel";
import { FileDialogUtils } from "../utils/file-dialog.utils";
import { Result } from "../types/result";
import { ProjectStorageService, TauriFileStorage } from "@/infrastructure/container";
import { defaultProjectData } from "../data-types/project.data";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { DialogService } from "./dialog.service";
import { useNavigationStore } from "@/ui/stores/navigation.store";
import { PathUtils } from "../utils/path.utils";
import { createProjectForm } from "../constant/form/create-project.form";
import { Console } from "./console.service";
import { Project } from "@/editor/model/project/project";

export class ProjectService {

    public static async importProject(): Promise<void> {
        const projectAbsPath = await FileDialogUtils.open({ multiple: false, filters: [{ name: "Project", extensions: ["json"] }] });
        if (!projectAbsPath) return;
        const projectDataResult = await ProjectStorageService.load(projectAbsPath);
        if (projectDataResult.status !== Result.Status.Success) {
            Console.error({ message: projectDataResult.message })
            return;
        }
        const metkDir = PathUtils.dirname(projectAbsPath);
        const projectAbsDir = PathUtils.dirname(metkDir);
        const projectResult = Project.create(projectDataResult.data, new ProjectPathSystem(projectAbsDir));
        if (projectResult.status !== Result.Status.Success) {
            Console.error({ message: projectResult.message });
            return;
        }
        const project = projectResult.data;

        const projectManager = appKernel.projectManager;
        projectManager.addProjectMetadata(project.metaData);
        await appKernel.saveProjectManager();

        const openProject = await DialogService.openPermissionDialog({ title: "Project opened successfully", description: "Do you want to open this project?" })

        if (openProject) useNavigationStore.getState().navigate!(`/workspace/${project.id}`);
    }

    public static async createProject(): Promise<void> {
        const form = await DialogService.openFormDialog(createProjectForm());

        if (!form) return;

        const projectAbsDir = PathUtils.join(form.destination, form.name);
        const metkDir = PathUtils.join(projectAbsDir, ".metk");

        const mkdirResult = await TauriFileStorage.mkdir(projectAbsDir);
        if (mkdirResult.status !== Result.Status.Success) {
            Console.error({ message: mkdirResult.message })
            return;
        }

        const mkdirMetkResult = await TauriFileStorage.mkdir(metkDir);
        if (mkdirMetkResult.status !== Result.Status.Success) {
            Console.error({ message: mkdirMetkResult.message })
            return;
        }

        const projectData = defaultProjectData({ name: form.name });
        const projectResult = Project.create(projectData, new ProjectPathSystem(projectAbsDir));
        if (projectResult.status !== Result.Status.Success) {
            Console.error({ message: projectResult.message })
            return;
        }
        const project = projectResult.data;

        const projectAbsPath = project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "project.json"));
        const saveResult = await ProjectStorageService.save(projectAbsPath, project.serialize());
        if (saveResult.status !== Result.Status.Success) {
            Console.error({ message: saveResult.message })
            return;
        }

        const projectManager = appKernel.projectManager;
        projectManager.addProjectMetadata(project.metaData);
        await appKernel.saveProjectManager();

        const openProject = await DialogService.openPermissionDialog({ title: "Project created successfully", description: "Do you want to open the project?" })

        if (openProject) useNavigationStore.getState().navigate!(`/workspace/${project.id}`);
    }

    public static async removeProject(projectId: string): Promise<void> {
        const confirm = await DialogService.openPermissionDialog({
            title: "Remove Project", // TODO: i18n
            description: "Are you sure you want to remove this project?"
        });

        if (!confirm) return;

        const projectManager = appKernel.projectManager;
        projectManager.removeProjectMetadata(projectId);
        await appKernel.saveProjectManager();
    }
}
