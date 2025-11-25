import { ProjectMetaData } from "@/core/schema/projectSchema";

export interface IProjectRepository {
    loadAll(): Promise<ProjectMetaData[]>;
    saveAll(content: ProjectMetaData[]): Promise<void>;
}