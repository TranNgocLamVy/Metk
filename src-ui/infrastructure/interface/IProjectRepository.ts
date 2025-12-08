import { ProjectMetaData } from "@/shared/schema/projectSchema";
import { Result } from "@/shared/types/result";

export interface IProjectRepository {
    loadAll(): Promise<ProjectMetaData[]>;
    saveAll(content: ProjectMetaData[]): Promise<Result>;
}