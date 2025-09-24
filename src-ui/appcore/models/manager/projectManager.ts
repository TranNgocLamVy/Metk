import EventEmitter from "eventemitter3";

import { DialogService } from "@/services/dialogService";
import { ToastService } from "@/services/toastService";
import { useProjectManagerStore } from "@/stores/project/projectManagerStore";

import { ProjectStorageService } from "../../../services/projectStorageService";
import { ProjectManagerData, ProjectMetaData } from "../../schemas/projectSchema";
import { Project } from "../project/project";

export type ProjectEventType = {
    projectsUpdated: () => void;
    projectOpen: (project: ProjectMetaData) => void;
}

export class ProjectManager extends EventEmitter<ProjectEventType> {
    public currentProject: Project | null = null;
    public tilemaps: any[]
    public tilesets: any[]
    public projects: Project[] = [];
    public constructor() {
        super();
        this.load();
    }

    private async load() {
        const data = await ProjectStorageService.loadProjectManager();
        // this.projectMetaDatas = data.projectMetaDatas;
        this.save();
    }

    public async addProject(project: Project) {
        this.projects.push(project);
        useProjectManagerStore.getState().addProject(project);
    }

    public async save() {
        // this.projectMetaDatas = this.projectMetaDatas.map((p) => {
        //     if (p.id === this.currentProject?.id) {
        //         return {
        //             ...this.currentProject.serialize(),
        //             directory: this.currentProject.directory,
        //             updatedAt: new Date().toDateString(),
        //         }
        //     }
        //     return {
        //         ...p,
        //         updatedAt: new Date().toDateString(),
        //     }
        // })
        // const data = this.serialize();
        // await ProjectStorageService.saveProjectManager(data);
        // setTimeout(() => {
        //     this.emit("projectsUpdated");
        // }, 100)
    }

    public async createProject() {
        const projectMetaData = await Project.createProject();

        if (!projectMetaData) return;

        // this.projectMetaDatas.push(projectMetaData);

        ToastService.success({ message: `Successfully created ${projectMetaData.name} project` })

        this.save();

        const open = await DialogService.openPermissionDialog({
            title: `Open "${projectMetaData.name}" now?`,
            description: "This will open the new project in the editor",
            okText: "Open",
            cancelText: "Cancel",
        })

        if (open) {
            this.openProject(projectMetaData.id);
        }
    }

    public async openProject(id: string) {
        // const projectMetaData = this.projectMetaDatas.find((p) => p.id === id);
        // if (!projectMetaData) return;
        // const projectData = await ProjectStorageService.loadProject(projectMetaData.directory);
        // if (!projectData) return;
        // const project = new Project({
        //     ...projectData,
        //     directory: projectMetaData.directory,
        // });
        // if (this.currentProject) {
        //     await this.currentProject.unload();
        // }
        // this.currentProject = project;
        // await this.currentProject.load();
        // this.emit("projectOpen", project);
    }

    // private serialize(): ProjectManagerData {
    //     return {
    //         projectMetaDatas: this.projectMetaDatas,
    //     };
    // }
}