import { v4 as uuidv4 } from "uuid";

import { ToastService } from "@/shared/services/toastService";
import { Result, ResultStatus } from "@/shared/types/result";
import { mkdir } from "@tauri-apps/plugin-fs";

import { IProjectRepository } from "../../infrastructure/interface/IProjectRepository";
import { IProjectStorageService } from "../../infrastructure/interface/IProjectStorageService";
import { ProjectData, ProjectMetaData } from "../../shared/schema/projectSchema";
import { Project } from "../application/project";
import { PROJECT_FILE_NAME } from "../constance/project";

export class ProjectManager {
    public currentProject: Project | null = null;

    public projectMetaDataMap: Map<string, ProjectMetaData> = new Map<string, ProjectMetaData>(); // id -> metaData
    public get projectMetaData (): ProjectMetaData[] {
        return Array.from(this.projectMetaDataMap.values()).map((metaData) => {
            const project = this.projectMap.get(metaData.id);
            if (!project) return metaData;
            return project.metaData;
        });
    }
    public projectMap: Map<string, Project> = new Map<string, Project>(); // id -> project

    public constructor(
        private readonly projectRepo: IProjectRepository, 
        private readonly projectStorageService: IProjectStorageService
    ) {}

    public async load() {
        const projectsMetaData = await this.projectRepo.loadAll();
        await Promise.all(projectsMetaData.map(async (metaData) => {
            const projectData = await this.projectStorageService.loadProject(metaData.directory + "\\" + PROJECT_FILE_NAME);
            if (!projectData) {
                this.projectMetaDataMap.set(metaData.id, metaData);
            } else {
                const project = new Project(projectData, metaData.directory, this.projectStorageService);
                this.projectMetaDataMap.set(project.metaData.id, project.metaData);
                this.projectMap.set(project.metaData.id, project);
            }
        }));
    }

    public async save() {
        this.projectRepo.saveAll(Array.from(this.projectMetaDataMap.values()));
    }

    public async saveCurrrentProject() {
        const project = this.currentProject;
        if (!project) return;
        const projectData = project.serialize();
        await this.projectStorageService.saveProject(project.metaData.directory + "\\" + PROJECT_FILE_NAME, projectData);
    }

    public async createProject(name: string, destination: string): Promise<Result<Project>> {
        const fullDirectory = destination + "\\" + name;

        try {   
            await mkdir(fullDirectory);
        } catch (error) {
            return { status: ResultStatus.Error, message: "Failed to create project" };
        }
        
        const projectData: ProjectData = {
            id: uuidv4(),
            name: name,
            version: "0.1.0",
            description: "",
            createdAt: new Date().toDateString(),
            updatedAt: new Date().toDateString(),
            tilemaps: [],
            tilesets: [],
        };

        const project = new Project(projectData, fullDirectory, this.projectStorageService);
        await this.projectStorageService.saveProject(fullDirectory + "\\" + PROJECT_FILE_NAME, project.serialize());

        this.projectMetaDataMap.set(project.metaData.id, project.metaData);
        this.projectMap.set(project.metaData.id, project);
        this.save();

        return { status: ResultStatus.Success, data: project };
    }

    // public async openProject(filePath: string): Promise<Result<any>> {
    //     const projectData = await this.projectStorageService.loadProject(filePath);
    //     if (!projectData) return { status: ResultStatus.Cancel };
    //     const directory = filePath.split("\\").slice(0, -1).join("\\");
    //     const project = new Project(projectData, directory, this.projectStorageService);
    //     return await this.loadProject(project.metaData.id);
    // }

    public async loadProject(id: string): Promise<Result<Project>> {
        const project = this.projectMap.get(id);
        if (project) {
            if (this.currentProject) {
                await this.currentProject.unload();
            }
            this.currentProject = project;
            await this.currentProject.load();
            return { status: ResultStatus.Success, data: this.currentProject };
        }
        ToastService.error({ message: "Project not found" });
        return { status: ResultStatus.Cancel };
    }
}