import { type } from "arktype";

import { IProjectStorageService } from "@/infrastructure/interface/IProjectStorageService";
import { ProjectData, ProjectDataSchema } from "@/shared/schema/projectSchema";
import { Result } from "@/shared/types/result";
import { JsonFormatter } from "@/shared/utils/jsonFormatter";
import { create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export class JsonProjectStorageService implements IProjectStorageService {
    public async loadProject(projectAbsPath: string): Promise<Result<ProjectData>> {
        const exist = await exists(projectAbsPath);
        if (!exist) return { status: "Error", message: "Project file not found" };
        const projectFileData = await readTextFile(projectAbsPath);
        if (!projectFileData) return { status: "Error", message: "Failed to read project file" };
        const projectData = ProjectDataSchema(projectFileData);
        if (projectData instanceof type.errors) {
            console.error(projectData.summary);
            return { status: "Error", message: "Failed to parse project file" };
        }
        return { status: "Success", data: projectData };
    }

    public async saveProject(projectAbsPath: string, content: ProjectData): Promise<Result> {
        const exist = await exists(projectAbsPath);
        const stringContent = JsonFormatter.format(content);
        if (!stringContent) return { status: "Error", message: "Error while formatting json" };
        if (exist) {   
            await writeTextFile(projectAbsPath, stringContent);
        } else {
            const file = await create(projectAbsPath);
            await file.write(new TextEncoder().encode(stringContent));
            await file.close();
        }
        return { status: "Success", data: null };
    }
}