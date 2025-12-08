import { v4 as uuidv4 } from "uuid";

import { Result, ResultStatus } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";
import { exists, mkdir } from "@tauri-apps/plugin-fs";

import { IProjectRepository } from "../../infrastructure/interface/IProjectRepository";
import { IProjectStorageService } from "../../infrastructure/interface/IProjectStorageService";
import { ProjectData, ProjectMetaData } from "../../shared/schema/projectSchema";
import { Project } from "../application/project";
import { PROJECT_FILE_NAME } from "../constance/project";

export class ProjectManager {
    public currentProject: Project | null = null;
    public projectMetaDataMap: Map<string, ProjectMetaData> = new Map<string, ProjectMetaData>(); // id -> metaData
    public get projectMetaData(): ProjectMetaData[] {
        return Array.from(this.projectMetaDataMap.values()).map((metaData) => {
            const project = this.projectMap.get(metaData.id);
            if (!project) return metaData;
            return project.metaData;
        });
    }
    /** id -> project, null: unloaded, undefined: not found */
    public projectMap: Map<string, Project | null> = new Map<string, Project | null>();

    public constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly projectStorageService: IProjectStorageService
    ) { }

    public async load() {
        const projectsMetaData = await this.projectRepo.loadAll();
        await Promise.all(projectsMetaData.map(async (metaData) => {
            this.projectMetaDataMap.set(metaData.id, metaData);
            const projectAbsPath = PathUtils.join(metaData.directory, PROJECT_FILE_NAME);
            const exist = await exists(projectAbsPath);
            if (exist) {
                metaData.found = true;
                this.projectMap.set(metaData.id, null)
            } else {
                metaData.found = false; 
            }
        }));
    }

    public async save(): Promise<Result> {
        return this.projectRepo.saveAll(Array.from(this.projectMetaDataMap.values()));
    }

    public async saveCurrrentProject(): Promise<Result> {
        const project = this.currentProject;
        if (!project) return { status: "Error", message: "No project selected" };
        const projectData = project.serialize();
        const projectAbsPath = PathUtils.join(project.metaData.directory, PROJECT_FILE_NAME);
        return await this.projectStorageService.saveProject(projectAbsPath, projectData);
    }

    public async createProject(name: string, destination: string): Promise<Result<Project>> {
        const projectDir = PathUtils.join(destination, name);
        try {
            await mkdir(projectDir);
        } catch (error) {
            return { status: ResultStatus.Error, message: "Failed to create project while make dir, error: " + error };
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

        const project = new Project(projectData, projectDir, this.projectStorageService);

        const projectAbsPath = PathUtils.join(projectDir, PROJECT_FILE_NAME);
        const saveProjectResult = await this.projectStorageService.saveProject(projectAbsPath, project.serialize());
        if (saveProjectResult.status !== "Success") {
            return { status: ResultStatus.Error, message: "Failed to create project while saving: " + saveProjectResult.message };
        }

        const saveResult = await this.save();
        if (saveResult.status !== "Success") {
            return { status: ResultStatus.Error, message: "Failed to create project while saving project meta data: " + saveResult.message };
        }
        this.projectMetaDataMap.set(project.metaData.id, project.metaData);
        this.projectMap.set(project.metaData.id, project);
        return { status: ResultStatus.Success, data: project };
    }

    public async openProject(projectAbsPath: string): Promise<Result> {
        const loadProjectResult = await this.projectStorageService.loadProject(projectAbsPath);
        if (!loadProjectResult.data) return { status: ResultStatus.Error, message: loadProjectResult.message };
        const projectData = loadProjectResult.data;
        if (!projectData) return { status: ResultStatus.Error, message: "Failed to open project, project data not found" };
        const projectDir = PathUtils.dirname(projectAbsPath);
        const project = new Project(projectData, projectDir, this.projectStorageService);
        this.projectMetaDataMap.set(project.metaData.id, project.metaData);
        this.projectMap.set(project.metaData.id, project);
        return { status: ResultStatus.Success, data: null, message: "Project opened successfully" };
    }

    public async loadProject(id: string): Promise<Result<Project>> {
        const metaData = this.projectMetaDataMap.get(id);
        if (!metaData) return { status: ResultStatus.Error, message: "Project meta data not found" };
        let project = this.projectMap.get(id);
        if (project === undefined) return { status: ResultStatus.Error, message: "Can not load project" }
        if (project === null) {
            const projectAbsPath = PathUtils.join(metaData.directory, PROJECT_FILE_NAME);
            const loadProjectResult = await this.projectStorageService.loadProject(projectAbsPath);
            const projectData = loadProjectResult.data;
            if (!projectData) return { status: ResultStatus.Error, message: loadProjectResult.message };
            const newProject = new Project(projectData, metaData.directory, this.projectStorageService);
            this.projectMetaDataMap.set(newProject.metaData.id, newProject.metaData);
            this.projectMap.set(newProject.metaData.id, newProject);
            project = newProject;
        }
        if (this.currentProject) {
            const saveResult = await this.saveCurrrentProject();
            if (saveResult.status == "Error") return { status: ResultStatus.Error, message: saveResult.message };
            await this.currentProject.unload();
        }
        this.currentProject = project;
        await this.currentProject.load();
        return { status: ResultStatus.Success, data: this.currentProject };
    }
}