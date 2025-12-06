import { ProjectData } from "../../shared/schema/projectSchema";

export interface IProjectStorageService {
    loadProject(filePath: string): Promise<ProjectData | null>;
    saveProject(filePath: string, content: ProjectData): Promise<void>;
}