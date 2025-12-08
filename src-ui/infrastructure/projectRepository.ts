import { type } from "arktype";

import { IProjectRepository } from "@/infrastructure/interface/IProjectRepository";
import { ProjectMetaData, ProjectRepoSchema } from "@/shared/schema/projectSchema";
import { Result } from "@/shared/types/result";
import { FileUtils } from "@/shared/utils/fileUtils";
import { JsonFormatter } from "@/shared/utils/jsonFormatter";
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

    public async saveAll(content: ProjectMetaData[]): Promise<Result> {
        const stringContext = JsonFormatter.format(content);
        if (!stringContext) return { status: "Error", message: "Failed to format project repo" };
        await writeTextFile(this.filename, stringContext, { baseDir: this.baseDir });
        return { status: "Success", data: null };
    }
}