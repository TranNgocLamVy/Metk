import { Result } from "@/shared/types/result";

import { ProjectData } from "../../shared/schema/projectSchema";

export interface IProjectStorageService {
    loadProject(projectAbsPath: string): Promise<Result<ProjectData>>;
    saveProject(projectAbsPaths: string, content: ProjectData): Promise<Result>;
}