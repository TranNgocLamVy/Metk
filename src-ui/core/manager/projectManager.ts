import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { ProjectMetaData, ProjectRepoData } from "../../shared/schema/projectSchema";
import { Project } from "../application/project";
import { ProjectStorageService } from "@/infrastructure/container";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";

export class ProjectManager {
    public currentProject: Project | null = null;
    public projectMetaDataMap: Map<string, ProjectMetaData> = new Map<string, ProjectMetaData>(); // id -> metaData

    public constructor( ) { }

    public load(projectRepoData: ProjectRepoData) {
        for (const metaData of projectRepoData) {
            this.projectMetaDataMap.set(metaData.id, metaData);
        }
    }

    public async setAndLoadProject(projectId: string) {
        if (this.currentProject) {
            if (this.currentProject.id === projectId) return Result.Success(this.currentProject);
            await this.currentProject.unload();
            this.currentProject = null;
        }

        const metaData = this.projectMetaDataMap.get(projectId);
        if (!metaData) return Result.Error("Project meta data not found");

        const projectAbsPath = PathUtils.join(metaData.directory, "project.json");
        const loadProjectResult = await ProjectStorageService.load(projectAbsPath);
        if (loadProjectResult.status !== Result.Status.Success) {
            return Result.Error(loadProjectResult.message);
        }

        const projectData = loadProjectResult.data;
        this.currentProject = new Project(projectData, new ProjectPathSystem(metaData.directory));

        await this.currentProject.load();

        return Result.Success(this.currentProject);
    }

    public async saveCurrrentProject(): Promise<Result> {
        const project = this.currentProject;
        if (!project) return Result.Error("No project selected");
        const projectAbsPath = project.projectPathSystem.getAbsPathFromRelPath("project.json")
        return await ProjectStorageService.save(projectAbsPath, project.serialize());
    }

    public addProjectMetaData(projectMetaData: ProjectMetaData): void {
        this.projectMetaDataMap.set(projectMetaData.id, projectMetaData);
    }

    public serialize(): ProjectMetaData[] {
        return Array.from(this.projectMetaDataMap.values()).map((metaData) => {
            if (this.currentProject && this.currentProject.id === metaData.id) return this.currentProject.metaData;
            return metaData;
        });
    }
}