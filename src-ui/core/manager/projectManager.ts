import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { ProjectMetadata, ProjectRepoData } from "../../shared/schema/projectSchema";
import { Project } from "../application/project";
import { ProjectStorageService } from "@/infrastructure/container";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";

export class ProjectManager {
    public currentProject: Project | null = null;
    public projectMetadataMap: Map<string, ProjectMetadata> = new Map<string, ProjectMetadata>(); // id -> metaData

    public constructor( ) { }

    public load(projectRepoData: ProjectRepoData) {
        for (const metaData of projectRepoData) {
            this.projectMetadataMap.set(metaData.id, metaData);
        }
    }

    public async setAndLoadProject(projectId: string) {
        if (this.currentProject) {
            if (this.currentProject.id === projectId) return Result.Success(this.currentProject);
            await this.currentProject.unload();
            this.currentProject = null;
        }

        const metaData = this.projectMetadataMap.get(projectId);
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

    public async unLoadProject() {
        if (!this.currentProject) return;
        await this.currentProject.unload();
        this.currentProject = null;
    }

    public async saveCurrrentProject(): Promise<Result> {
        const project = this.currentProject;
        if (!project) return Result.Error("No project selected");
        const projectAbsPath = project.projectPathSystem.getAbsPathFromRelPath("project.json")
        return await ProjectStorageService.save(projectAbsPath, project.serialize());
    }

    public addProjectMetadata(projectMetadata: ProjectMetadata): void {
        this.projectMetadataMap.set(projectMetadata.id, projectMetadata);
    }

    public serialize(): ProjectMetadata[] {
        return Array.from(this.projectMetadataMap.values()).map((metaData) => {
            if (this.currentProject && this.currentProject.id === metaData.id) return this.currentProject.metaData;
            return metaData;
        });
    }
}