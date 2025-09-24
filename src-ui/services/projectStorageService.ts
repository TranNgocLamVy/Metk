import { type } from "arktype";

import { FileUtils } from "@/utils/FileUtils";
import { BaseDirectory } from "@tauri-apps/api/path";
import { mkdir, writeTextFile } from "@tauri-apps/plugin-fs";

import { ProjectData, ProjectManagerData, ProjectManagerSchema, ProjectSchema } from "../appcore/schemas/projectSchema";

const PROJECTS_FILE_NAME = "projects.json";
const PROJECT_FILE_NAME = "project.json";

export class ProjectStorageService {
    public static async loadProjectManager(): Promise<ProjectManagerData> {
        await FileUtils.ensureAppDataDir();
        const projectFileData = await FileUtils.readOrCreateTextFile(PROJECTS_FILE_NAME, BaseDirectory.AppData, "{}");
        const projectData = ProjectManagerSchema(projectFileData);
        if (projectData instanceof type.errors) {
            console.error(projectData.summary);
            return {
                projectMetaDatas: []
            };
        }
        return projectData;
    }

    public static async saveProjectManager(data: ProjectManagerData): Promise<void> {
        await FileUtils.ensureAppDataDir();
        await writeTextFile(PROJECTS_FILE_NAME, JSON.stringify(data), { baseDir: BaseDirectory.AppData });
    }

    public static async createProject(data: ProjectData, dir: string): Promise<void> {
        await mkdir(dir);
        const fullPath = dir + "\\" + PROJECT_FILE_NAME;
        await writeTextFile(fullPath, JSON.stringify(data));
    }

    public static async loadProject(directory: string): Promise<ProjectData | null> {
        const fullPath = directory + "\\" + PROJECT_FILE_NAME;
        const projectFileData = await FileUtils.readTextFile(fullPath, BaseDirectory.AppData);
        if (!projectFileData) return null;
        const projectData = ProjectSchema(projectFileData);
        if (projectData instanceof type.errors) {
            console.error(projectData.summary);
            return null;
        }
        return projectData;
    }

    public static async saveProject(data: ProjectData, dir: string): Promise<void> {
        const path = dir + "\\" + PROJECT_FILE_NAME;
        const projectFileData = JSON.stringify(data);
        await writeTextFile(path, projectFileData, { baseDir: BaseDirectory.AppData });
    }
}
