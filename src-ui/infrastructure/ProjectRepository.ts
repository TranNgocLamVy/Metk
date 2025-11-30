import { type } from "arktype";

import { IProjectRepository } from "@/core/interface/IProjectRepository";
import { ProjectMetaData, ProjectRepoSchema } from "@/core/schema/projectSchema";
import { FileUtils } from "@/shared/utils/FileUtils";
import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";

export class JsonProjectRepository implements IProjectRepository {
    private filename: string;
    private baseDir: BaseDirectory;

    constructor(filename: string, baseDir: BaseDirectory) {
        this.filename = filename;
        this.baseDir = baseDir;
    }

    public async loadAll(): Promise<ProjectMetaData[]> {
        await FileUtils.ensureAppDataDir();
        const projectRepoRawData = await FileUtils.readOrCreateTextFile(this.filename, this.baseDir, "{}");
        const projectRepoData = ProjectRepoSchema(projectRepoRawData);
        if (projectRepoData instanceof type.errors) {
            console.error(projectRepoData.summary);
            return []
        }
        return projectRepoData;
    }

    public async saveAll(content: ProjectMetaData[]): Promise<void> {
        await FileUtils.ensureAppDataDir();
        await writeTextFile(this.filename, JSON.stringify(content), { baseDir: this.baseDir });
    }
}