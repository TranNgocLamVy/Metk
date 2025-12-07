import { ProjectMetaData } from "@/shared/schema/projectSchema";

export interface IProjectRepository {
    loadAll(): Promise<ProjectMetaData[]>;
    saveAll(content: ProjectMetaData[]): Promise<void>;
}