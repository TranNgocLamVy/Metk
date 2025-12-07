import { type } from "arktype";
import stringify from "json-stringify-pretty-compact";

import { IProjectStorageService } from "@/infrastructure/interface/IProjectStorageService";
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
        const stringContent = stringify(content, { maxLength: 80, indent: 2 })
        if (exist) {   
            await writeTextFile(projectAbsPath, stringContent);
        } else {
            const file = await create(projectAbsPath);
            await file.write(new TextEncoder().encode(stringContent));
            await file.close();
        }

    }
}