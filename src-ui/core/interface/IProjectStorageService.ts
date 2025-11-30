import { ProjectData } from "../schema/projectSchema";

export interface IProjectStorageService {
    loadProject(filePath: string): Promise<ProjectData | null>;
    saveProject(filePath: string, content: any): Promise<void>;
}