import { Result } from "@/shared/types/result";

import { ProjectData } from "../../shared/schema/projectSchema";

export interface IProjectStorageService {
    loadProject(filePath: string): Promise<Result<ProjectData>>;
    saveProject(filePath: string, content: ProjectData): Promise<Result>;
}