import EventEmitter from "eventemitter3";
import { v4 as uuidv4 } from "uuid";

import { Result, ResultStatus } from "@/core/constance/common/result";
import { DialogService } from "@/shared/services/dialogService";
import { useProjectManagerStore } from "@/view/stores/project/projectManagerStore";
import { exists, mkdir } from "@tauri-apps/plugin-fs";

import { Project } from "../domain/project";
import { IProjectRepository } from "../interface/domain/IProjectRepository";
import { IProjectStorageService } from "../interface/domain/IProjectStorageService";
import { ProjectMetaData } from "../schema/projectSchema";

export type ProjectEventType = {
    projectsUpdated: () => void;
    projectOpen: (project: ProjectMetaData) => void;
}

const PROJECT_FILE_NAME = "project.json";

export class ProjectManager extends EventEmitter<ProjectEventType> {
    private projectRepo: IProjectRepository;
    private projectStorageService: IProjectStorageService;

    public currentProject: Project | null = null;
    public projects: Project[] = [];

    public constructor(projectRepo: IProjectRepository, projectStorageService: IProjectStorageService) {
        super();
        this.projectRepo = projectRepo;
        this.projectStorageService = projectStorageService;
    }

    public async load() {
        const projectsMetaData = await this.projectRepo.loadAll();
        const projects = await Promise.all(projectsMetaData.map(async (metaData) => {
            const projectData = await this.projectStorageService.loadProject(metaData.directory + "\\" + PROJECT_FILE_NAME);
            if (!projectData) return null;
            const project = new Project(projectData, metaData.directory);
            return project;
        }));
        projects.forEach((p) => { 
            if (p) {
                this.projects.push(p)
                useProjectManagerStore.getState().addProject(p);
            }
        })
        this.save();
    }

    public async addProject(project: Project) {
        this.projects.push(project);
        this.save();
        useProjectManagerStore.getState().addProject(project);
    }

    public async save() {
        this.projectRepo.saveAll(this.projects.map((p) => p.metaData));
    }

    public async saveCurrrentProject() {
        const project = this.currentProject;
        if (!project) return;
        const projectData = project.serialize();
        await this.projectStorageService.saveProject(project.metaData.directory + "\\" + PROJECT_FILE_NAME, projectData);
    }

    public async createProject(): Promise<Result> {
        const form = await DialogService.openFormDialog({
            title: "Create new Project",
            okText: "Create",
            cancelText: "Cancel",
            inputs: [
                {
                    id: "name",
                    name: "name",
                    type: "text",
                    label: "Project Name",
                    placeholder: "Your Tile Project",
                    required: true,
                },
                {
                    id: "destination",
                    name: "destination",
                    type: "folderPath",
                    label: "Destination",
                    placeholder: "Select a folder",
                    required: true,
                }
            ],
            async validateBeforeSubmit(values) {
                const path = values.destination + "\\" + values.name;
                const isExists = await exists(path);

                if (isExists) {
                    return { valid: false, message: `Folder with name "${values.name}" already exists at "${values.destination}"` }
                }

                return { valid: true }
            },
        })
        if (!form) return { status: ResultStatus.Cancel };

        const fullDirectory = form.destination + "\\" + form.name;
        await mkdir(fullDirectory);
        const project = new Project({
            id: uuidv4(),
            name: form.name,
            version: "0.1.0",
            description: "",
            createdAt: new Date().toDateString(),
            updatedAt: new Date().toDateString(),
            tilemapPaths: [],
            tilesetPaths: [],
        }, fullDirectory);

        await this.projectStorageService.saveProject(fullDirectory + "\\" + PROJECT_FILE_NAME, project.serialize());
        this.addProject(project);
        return { status: ResultStatus.Success };
    }

    public async openProject(filePath: string): Promise<Result> {
        const projectData = await this.projectStorageService.loadProject(filePath);
        if (!projectData) return { status: ResultStatus.Cancel };
        const directory = filePath.split("\\").slice(0, -1).join("\\");
        const project = new Project(projectData, directory);
        this.addProject(project);
        return await this.setCurrentProject(project.metaData.id);
    }

    public async setCurrentProject(id: string): Promise<Result> {
        const project = this.projects.find((p) => p.metaData.id === id);
        if (!project) return { status: ResultStatus.Cancel };
        if (this.currentProject) {
            await this.currentProject.unload();
        }
        this.currentProject = project;
        await this.currentProject.load();
        this.emit("projectOpen", project.metaData);
        return { status: ResultStatus.Success };
    }
}