import { appKernel } from "@/application/bootstrap/app-kernel";
import { Result } from "@/shared/types/result";
import { FileDialogService, FileSystemService, ProjectStorageService } from "@/infrastructure/container";
import { defaultProjectData } from "@/shared/data-types/project.data";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { DialogService } from "@/ui/dialogs/dialog-gateway";
import { getNavigationStoreState } from "@/ui/stores/navigation.store";
import { PathUtils } from "@/shared/utils/path.utils";
import { createProjectForm } from "@/shared/constant/form/create-project.form";
import { Console } from "@/ui/notifications/console-gateway";
import { Project } from "@/editor/model/project/project";
import i18n from "@/app/providers/i18n";

export async function importProject(): Promise<void> {
        const projectAbsPath = await FileDialogService.open({ multiple: false, filters: [{ name: i18n.t("fileDialog.filters.project"), extensions: ["json"] }] });
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

        const openProject = await DialogService.openPermissionDialog({ title: "dialog.project.opened.title", description: "dialog.project.opened.description" })

        if (openProject) getNavigationStoreState().navigate!(`/workspace/${project.id}`);
}

export async function createProject(): Promise<void> {
        const form = await DialogService.openFormDialog(createProjectForm({ fileSystem: FileSystemService }));

        if (!form) return;

        const projectAbsDir = PathUtils.join(form.destination, form.name);
        const metkDir = PathUtils.join(projectAbsDir, ".metk");

        const mkdirResult = await FileSystemService.mkdir(projectAbsDir);
        if (mkdirResult.status !== Result.Status.Success) {
            Console.error({ message: mkdirResult.message })
            return;
        }

        const mkdirMetkResult = await FileSystemService.mkdir(metkDir);
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

        const openProject = await DialogService.openPermissionDialog({ title: "dialog.project.created.title", description: "dialog.project.created.description" })

        if (openProject) getNavigationStoreState().navigate!(`/workspace/${project.id}`);
}

export async function removeProject(projectId: string): Promise<void> {
        const confirm = await DialogService.openPermissionDialog({
            title: "dialog.remove.project.title",
            description: "dialog.remove.project.description"
        });

        if (!confirm) return;

        const projectManager = appKernel.projectManager;
        projectManager.removeProjectMetadata(projectId);
        await appKernel.saveProjectManager();
}
