import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";
import { mkdir } from "@tauri-apps/plugin-fs";

import { ProjectData, ProjectMetaData } from "../../shared/schema/projectSchema";
import { Project } from "../application/project";
import { ProjectMetaDataRepo, ProjectStorageService } from "@/infrastructure/container";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";

export class ProjectManager {
    public currentProject: Project | null = null;

    // TODO: find a better way to manage project meta data, when project update or delete, the meta data should be updated
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

    public constructor( ) { }

    public async load() {
        const result = await ProjectMetaDataRepo.load('projects.json');

        if (result.status != Result.Status.Success) {
            console.error(result.message);
            // TODO: handle error
            return;
        }

        const projectsMetaData = result.data;

        await Promise.all(projectsMetaData.map(async (metaData) => {
            this.projectMetaDataMap.set(metaData.id, metaData);
            this.projectMap.set(metaData.id, null);
        }));
    }

    public async save(): Promise<Result> {
        return ProjectMetaDataRepo.save("projects.json", Array.from(this.projectMetaDataMap.values()));
    }

    public async saveCurrrentProject(): Promise<Result> {
        const project = this.currentProject;
        if (!project) return { status: "Error", message: "No project selected" };
        const projectData = project.serialize();
        const projectAbsPath = PathUtils.join(project.projectPathSystem.getAbsPathFromRelPath("project.json"));
        return await ProjectStorageService.save(projectAbsPath, projectData);
    }

    public async createProject(name: string, destination: string): Promise<Result<Project>> {
        const projectDir = PathUtils.join(destination, name);
        try {
            await mkdir(projectDir);
        } catch (error) {
            return { status: Result.Status.Error, message: "Failed to create project while make dir, error: " + error };
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

        const projectPathSystem = new ProjectPathSystem(projectDir);
        const project = new Project(projectData, projectPathSystem);

        const projectAbsPath = projectPathSystem.getAbsPathFromRelPath("project.json");
        const saveProjectResult = await ProjectStorageService.save(projectAbsPath, project.serialize());
        if (saveProjectResult.status !== Result.Status.Success) {
            return { status: Result.Status.Error, message: "Failed to create project while saving: " + saveProjectResult.message };
        }

        const saveResult = await this.save();
        if (saveResult.status !== Result.Status.Success) {
            return { status: Result.Status.Error, message: "Failed to create project while saving project meta data: " + saveResult.message };
        }
        this.projectMetaDataMap.set(project.id, project.metaData);
        this.projectMap.set(project.id, project);
        return { status: Result.Status.Success, data: project };
    }

    public async openProject(projectAbsPath: string): Promise<Result> {
        const loadProjectResult = await ProjectStorageService.load(projectAbsPath);
        if (!loadProjectResult.data) return { status: Result.Status.Error, message: loadProjectResult.message };
        const projectData = loadProjectResult.data;
        if (!projectData) return { status: Result.Status.Error, message: "Failed to open project, project data not found" };
        const projectDir = PathUtils.dirname(projectAbsPath);
        const projectPathSystem = new ProjectPathSystem(projectDir);
        const project = new Project(projectData, projectPathSystem);
        this.projectMetaDataMap.set(project.id, project.metaData);
        this.projectMap.set(project.id, project);
        return { status: Result.Status.Success, data: null, message: "Project opened successfully" };
    }

    public async loadProject(id: string): Promise<Result<Project>> {
        if (this.currentProject) {
            if (this.currentProject.id === id) return { status: Result.Status.Success, data: this.currentProject };
            
            const saveResult = await this.saveCurrrentProject();
            if (saveResult.status === Result.Status.Error) return { status: Result.Status.Error, message: saveResult.message };
            await this.currentProject.unload();
        }

        const metaData = this.projectMetaDataMap.get(id);
        if (!metaData) return { status: Result.Status.Error, message: "Project meta data not found" };
        let project = this.projectMap.get(id);
        if (project === undefined) return { status: Result.Status.Error, message: "Can not load project" }
        if (project === null) {
            const projectAbsPath = PathUtils.join(metaData.directory, "project.json");
            const loadProjectResult = await ProjectStorageService.load(projectAbsPath);
            const projectData = loadProjectResult.data;
            if (!projectData) return { status: Result.Status.Error, message: loadProjectResult.message };

            const projectPathSystem = new ProjectPathSystem(metaData.directory);
            const newProject = new Project(projectData, projectPathSystem);

            this.projectMetaDataMap.set(newProject.id, newProject.metaData);
            this.projectMap.set(newProject.id, newProject);
            project = newProject;
        }
        if (this.currentProject) {
            const saveResult = await this.saveCurrrentProject();
            if (saveResult.status === Result.Status.Error) return { status: Result.Status.Error, message: saveResult.message };
            await this.currentProject.unload();
        }
        this.currentProject = project;
        await this.currentProject.load();
        return { status: Result.Status.Success, data: this.currentProject };
    }
}