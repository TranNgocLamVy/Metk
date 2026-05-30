import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/path.utils";
import { ProjectStorageService } from "@/infrastructure/container";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import EventEmitter from "eventemitter3";
import { ProjectMetadata } from "@/shared/data-types/project.data";
import { Project } from "@/editor/model/project/project";
import { normalizeProjectMetadataRepo } from "@/editor/model/project/project.normalizer";

type ProjectManagerEvent = {
    onProjectMetadatasChanged: (projectMetadata: ProjectMetadata[]) => void;
    onProjectLoaded: (project: Project) => void;
    onProjectUnloaded: (projectId: string) => void;
}
export class ProjectManager extends EventEmitter<ProjectManagerEvent> {
    public currentProject: Project | null = null;
    public projectMetadataMap: Map<string, ProjectMetadata> = new Map<string, ProjectMetadata>();

    public constructor( ) {
        super();
    }

    public load(projectRepoData: unknown) {
        const normalizedRepoData = normalizeProjectMetadataRepo(projectRepoData);
        for (const metaData of normalizedRepoData) {
            this.projectMetadataMap.set(metaData.id, metaData);
        }
        this.emit("onProjectMetadatasChanged", this.serialize());
    }

    public async setAndLoadProject(projectId: string) {
        if (this.currentProject) {
            if (this.currentProject.id === projectId) return Result.Success(this.currentProject);
            await this.currentProject.destroy();
            this.currentProject = null;
        }

        const metaData = this.projectMetadataMap.get(projectId);
        if (!metaData) return Result.Error("Project meta data not found"); // TODO: i18n

        const projectAbsPath = PathUtils.join(metaData.directory, ".metk", "project.json");
        const loadProjectResult = await ProjectStorageService.load(projectAbsPath);
        if (loadProjectResult.status !== Result.Status.Success) {
            return Result.Error(loadProjectResult.message);
        }

        const projectResult = Project.create(loadProjectResult.data, new ProjectPathSystem(metaData.directory));
        if (projectResult.status !== Result.Status.Success) {
            return Result.Error(projectResult.message);
        }

        this.currentProject = projectResult.data;

        await this.currentProject.load();
        this.emit("onProjectLoaded", this.currentProject);
        return Result.Success(this.currentProject);
    }

    public async unLoadProject() {
        if (!this.currentProject) return;
        const projectId = this.currentProject.id;
        await this.currentProject.destroy();
        this.currentProject = null;
        this.emit("onProjectUnloaded", projectId);
    }

    public async saveCurrrentProject(): Promise<Result> {
        const project = this.currentProject;
        if (!project) return Result.Cancel();
        const projectAbsPath = project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "project.json"))
        return await ProjectStorageService.save(projectAbsPath, project.serialize());
    }

    public addProjectMetadata(projectMetadata: ProjectMetadata): void {
        this.projectMetadataMap.set(projectMetadata.id, projectMetadata);
        this.emit("onProjectMetadatasChanged", this.serialize());
    }

    public removeProjectMetadata(projectId: string): void {
        this.projectMetadataMap.delete(projectId);
        this.emit("onProjectMetadatasChanged", this.serialize());
    }

    public serialize(): ProjectMetadata[] {
        return Array.from(this.projectMetadataMap.values()).map((metaData) => {
            if (this.currentProject && this.currentProject.id === metaData.id) return this.currentProject.metaData;
            return metaData;
        });
    }
}