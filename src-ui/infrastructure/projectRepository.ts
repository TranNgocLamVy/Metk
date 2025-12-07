import { type } from "arktype";

import { IProjectRepository } from "@/infrastructure/interface/IProjectRepository";
import { ProjectMetaData, ProjectRepoSchema } from "@/shared/schema/projectSchema";
import { FileUtils } from "@/shared/utils/fileUtils";
import { BaseDirectory, create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

const PROJECT_REPO_FILE_NAME = "projects.json";

export class JsonProjectRepository implements IProjectRepository {
    private filename: string = PROJECT_REPO_FILE_NAME;
    private baseDir: BaseDirectory = BaseDirectory.AppData;

    public async loadAll(): Promise<ProjectMetaData[]> {
        await FileUtils.ensureAppDataDir();
        const exist = await exists(this.filename, { baseDir: this.baseDir });
        let projectRepoRawData: string;
        if (exist) {
            projectRepoRawData = await readTextFile(this.filename, { baseDir: this.baseDir });
        } else {
            const defaultContent = "{}";
            const file = await create(this.filename, { baseDir: this.baseDir });
            await file.write(new TextEncoder().encode(defaultContent));
            await file.close();
            projectRepoRawData = defaultContent;
        }
        const projectRepoData = ProjectRepoSchema(projectRepoRawData);
        if (projectRepoData instanceof type.errors) {
            console.error(projectRepoData.summary);
            return []
        }
        return projectRepoData;
    }

    public async saveAll(content: ProjectMetaData[]): Promise<void> {
        await writeTextFile(this.filename, JSON.stringify(content), { baseDir: this.baseDir });
    }
}