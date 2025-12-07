

import { JsonProjectRepository } from "@/infrastructure/projectRepository";
import { JsonProjectStorageService } from "@/infrastructure/projectStorageService";

import { Project } from "./application/project";
import { ProjectManager } from "./manager/projectManager";

export class AppCore {
    private static _instance: AppCore;
    public readonly projectManager: ProjectManager;

    private constructor() {
        const projectRepo = new JsonProjectRepository();
        const projectStorageService = new JsonProjectStorageService();
        this.projectManager = new ProjectManager(projectRepo, projectStorageService);
    }

    public async load() {
        await this.projectManager.load();
    }

    public static initialize() {
        if (AppCore._instance) return;
        const global = globalThis as any;
        if (import.meta.env.DEV && global.__APP_CORE_INSTANCE__) {
            AppCore._instance = global.__APP_CORE_INSTANCE__;
            return;
        }
        AppCore._instance = new AppCore();
        if (import.meta.env.DEV) global.__APP_CORE_INSTANCE__ = AppCore._instance;
    }

    public static getIns(): AppCore {
        if (!this._instance) {
            this.initialize();
        }
        return this._instance;
    }


    public getCurrentProject(): Project {
        const currentProject = this.projectManager.currentProject;
        if (!currentProject) throw new Error("Current project not found");
        return currentProject;
    }
}