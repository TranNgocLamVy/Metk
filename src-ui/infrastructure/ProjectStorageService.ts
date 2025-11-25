import { type } from "arktype";

import { IProjectStorageService } from "@/core/interface/domain/IProjectStorageService";
import { ProjectData, ProjectDataSchema } from "@/core/schema/projectSchema";
import { FileUtils } from "@/shared/utils/FileUtils";
import { BaseDirectory } from "@tauri-apps/plugin-fs";

export class JsonProjectStorageService implements IProjectStorageService {
    private baseDirectory: BaseDirectory;

    constructor(baseDirectory: BaseDirectory) {
        this.baseDirectory = baseDirectory;
    }

    public async loadProject(filePath: string): Promise<ProjectData | null> {
        const projectFileData = await FileUtils.readTextFile(filePath, this.baseDirectory);
        if (!projectFileData) return null;
        const projectData = ProjectDataSchema(projectFileData);
        if (projectData instanceof type.errors) {
            console.error(projectData.summary);
            return null;
        }
        return projectData;
    }

    public async saveProject(filePath: string, content: any): Promise<void> {
        await FileUtils.writeTextFile(filePath, this.baseDirectory, JSON.stringify(content));
    }
}