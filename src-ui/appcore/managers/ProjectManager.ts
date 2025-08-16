import EventEmitter from "eventemitter3";

import { DialogService } from "@/appcore/services/DialogService";
import { ToastService } from "@/appcore/services/ToastService";
import { useProjectStore } from "@/stores/ui/ProjectStore";

import { Project } from "../models/Project";
import { ProjectManagerData } from "../schemas/projectSchema";
import { ProjectStorageService } from "../services/ProjectStorageService";

export type ProjectEventType = {
    projectsUpdated: () => void;
    projectOpen: (project: Project) => void;
}

export class ProjectManager extends EventEmitter<ProjectEventType> {
    public currentProject: Project | null = null;
    public projects: Project[] = [];
    public tilemaps: any[]
    public tilesets: any[]
    public projectPaths: string[] = [];
    public constructor() {
        super();
        this.load();
        this.on("projectsUpdated", () => {
            useProjectStore.getState().setProjects([...this.projects]);
        });
    }

    private async load() {
        const data = await ProjectStorageService.loadProjectManager();
        this.projectPaths = data.projectPaths;
        await Promise.all(this.projectPaths.map(async (path) => {
            const projectData = await ProjectStorageService.loadProject(path);
            if (projectData) {
                const project = new Project({...projectData, directory: path});
                this.projects.push(project);
            }
        }))
        this.save();
    }

    public async save() {
        const data = this.serialize();
        await ProjectStorageService.saveProjectManager(data);
        setTimeout(() => {
            this.emit("projectsUpdated");
        }, 100)
    }

    public async createProject() {
        const project = await Project.createProject();

        if (!project) return;

        this.projects.push(project);

        ToastService.success({ message: `Successfully created ${project.name} project` })

        this.save();

        const open = await DialogService.openPermissionDialog({
            title: `Open "${project.name}" now?`,
            description: "This will open the new project in the editor",
            okText: "Open",
            cancelText: "Cancel",
        })

        if (open) {
            this.emit("projectOpen", project);
        }
    }

    private serialize(): ProjectManagerData {
        return {
            projectPaths: this.projects.map((project) => project.directory),
        };
    }
}