import EventEmitter from "eventemitter3";

import { DialogService } from "@/appcore/services/DialogService";
import { ToastService } from "@/appcore/services/ToastService";
import { useProjectStore } from "@/stores/menu/ProjectStore";

import { ProjectManagerData, ProjectMetaData } from "../../schemas/projectSchema";
import { ProjectStorageService } from "../../services/ProjectStorageService";
import { Project } from "../project/Project";

export type ProjectEventType = {
    projectsUpdated: () => void;
    projectOpen: (project: ProjectMetaData) => void;
}

export class ProjectManager extends EventEmitter<ProjectEventType> {
    public currentProject: Project | null = null;
    public tilemaps: any[]
    public tilesets: any[]
    public projectMataDatas: ProjectMetaData[] = [];
    public constructor() {
        super();
        this.load();
        this.on("projectsUpdated", () => {
            useProjectStore.getState().setProjects([...this.projectMataDatas]);
        });
    }

    private async load() {
        const data = await ProjectStorageService.loadProjectManager();
        this.projectMataDatas = data.projectMetaDatas;
        this.save();
    }

    public async save() {
        this.projectMataDatas = this.projectMataDatas.map((p) => {
            if (p.id === this.currentProject?.id) {
                return {
                    ...this.currentProject.serialize(),
                    directory: this.currentProject.directory,
                    updatedAt: new Date().toDateString(),
                }
            }
            return {
                ...p,
                updatedAt: new Date().toDateString(),
            }
        })
        const data = this.serialize();
        await ProjectStorageService.saveProjectManager(data);
        setTimeout(() => {
            this.emit("projectsUpdated");
        }, 100)
    }

    public async createProject() {
        const projectMetaData = await Project.createProject();

        if (!projectMetaData) return;

        this.projectMataDatas.push(projectMetaData);

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
        const projectMetaData = this.projectMataDatas.find((p) => p.id === id);
        if (!projectMetaData) return;
        const projectData = await ProjectStorageService.loadProject(projectMetaData.directory);
        if (!projectData) return;
        const project = new Project({
            ...projectData,
            directory: projectMetaData.directory,
        });
        if (this.currentProject) {
            await this.currentProject.unload();
        }
        this.currentProject = project;
        await this.currentProject.load();
        this.emit("projectOpen", project);
    }

    private serialize(): ProjectManagerData {
        return {
            projectMetaDatas: this.projectMataDatas,
        };
    }
}