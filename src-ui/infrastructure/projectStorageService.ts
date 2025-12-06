import { type } from "arktype";

import { IProjectStorageService } from "@/core/interface/IProjectStorageService";
import { ProjectData, ProjectDataSchema } from "@/shared/schema/projectSchema";
import { create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export class JsonProjectStorageService implements IProjectStorageService {
    public async loadProject(projectAbsPath: string): Promise<ProjectData | null> {
        const exist = await exists(projectAbsPath);
        if (!exist) return null;
        const projectFileData = await readTextFile(projectAbsPath);
        if (!projectFileData) return null;

        return JSON.parse(projectFileData);

        // const projectData = ProjectDataSchema(projectFileData);
        // if (projectData instanceof type.errors) {
        //     console.error(projectData.summary);
        //     return null;
        // }
        // return projectData;
    }

    public async saveProject(projectAbsPath: string, content: ProjectData): Promise<void> {
        const exist = await exists(projectAbsPath);
        const projectFileData = JSON.stringify(content);
        if (exist) {   
            await writeTextFile(projectAbsPath, projectFileData);
        } else {
            const file = await create(projectAbsPath);
            await file.write(new TextEncoder().encode(projectFileData));
            await file.close();
        }

    }
}