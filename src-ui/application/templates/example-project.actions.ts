import { appKernel } from "@/application/bootstrap/app-kernel";
import { ExampleProjectService } from "@/application/templates/example-project.service";
import { DiscoveredExampleProjectTemplate } from "@/application/templates/example-project.types";
import { Project } from "@/editor/model/project/project";
import { FileSystemService, ProjectStorageService } from "@/infrastructure/container";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { createExampleProjectForm } from "@/shared/constant/form/create-example-project.form";
import { Result } from "@/shared/types/result";
import { DialogService } from "@/ui/dialogs/dialog-gateway";
import { Console } from "@/ui/notifications/console-gateway";
import { useNavigationStore } from "@/ui/stores/navigation.store";

const exampleProjectService = new ExampleProjectService();

export async function createExampleProject(): Promise<void> {
    const templatesResult = await exampleProjectService.discoverBundledTemplates();
    if (templatesResult.status !== Result.Status.Success) {
        Console.error({ message: templatesResult.message });
        return;
    }

    const templates = templatesResult.data;
    if (templates.length === 0) {
        Console.error({ message: "No bundled example project templates were found." });
        return;
    }

    const selectedTemplate = await selectTemplate(templates);
    if (!selectedTemplate) return;

    const form = await DialogService.openFormDialog(
        createExampleProjectForm({
            fileSystem: FileSystemService,
            defaultName: `My ${selectedTemplate.manifest.name}`,
        }),
    );

    if (!form) return;

    const cloneResult = await exampleProjectService.createProjectFromTemplate({
        template: selectedTemplate,
        destinationDir: form.destination,
        projectName: form.name,
    });

    if (cloneResult.status !== Result.Status.Success) {
        Console.error({ message: cloneResult.message, stacks: cloneResult.stacks });
        return;
    }

    const projectDataResult = await ProjectStorageService.load(cloneResult.data.projectEntryAbsPath);
    if (projectDataResult.status !== Result.Status.Success) {
        Console.error({ message: projectDataResult.message });
        return;
    }

    const projectResult = Project.create(projectDataResult.data, new ProjectPathSystem(cloneResult.data.projectAbsDir));
    if (projectResult.status !== Result.Status.Success) {
        Console.error({ message: projectResult.message });
        return;
    }

    const project = projectResult.data;
    appKernel.projectManager.addProjectMetadata(project.metaData);
    await appKernel.saveProjectManager();

    const openProject = await DialogService.openPermissionDialog({
        title: "Example project created successfully",
        description: "Do you want to open the project?",
    });

    if (openProject) useNavigationStore.getState().navigate!(`/workspace/${project.id}`);
}

async function selectTemplate(
    templates: DiscoveredExampleProjectTemplate[],
): Promise<DiscoveredExampleProjectTemplate | null> {
    console.log(templates);
    
    if (templates.length === 1) return templates[0];

    const selectedId = await DialogService.openExampleProjectTemplateDialog(templates);
    if (!selectedId) return null;

    return templates.find((template) => template.manifest.id === selectedId) ?? null;
}
