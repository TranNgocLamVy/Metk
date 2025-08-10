import EventEmitter from "eventemitter3";

import { DialogService } from "@/appcore/services/DialogService";
import { ToastService } from "@/appcore/services/ToastService";
import { useProjectStore } from "@/stores/ui/ProjectStore";

import { Project, ProjectFileData } from "./Project";

export type ProjectEventType = {
    
}

export class ProjectManager extends EventEmitter<ProjectEventType> {
    private static instance: ProjectManager;
    public projectDatas: ProjectFileData[] = [];
    public currentProject: Project | null = null;
    public currentProjectName: string = "";
    private constructor() {
        super();
        // TODO: Load projects
    }

    public static getInstance(): ProjectManager {
        if (!ProjectManager.instance) {
            ProjectManager.instance = new ProjectManager();
        }
        return ProjectManager.instance;
    }

    public async createProject() {
        const project = await Project.createProject();
        if (!project) return;

        this.projectDatas.push(project.serialize());

        ToastService.success({ message: `Successfully created ${project.name} project` })

        useProjectStore.getState().setProjects(this.projectDatas);

        const open = await DialogService.openPermissionDialog({
            title: `Open "${project.name}" now?`,
            description: "This will open the new project in the editor",
            okText: "Open",
            cancelText: "Cancel",
        })
    }
}