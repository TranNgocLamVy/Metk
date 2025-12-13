

import { JsonProjectRepository } from "@/infrastructure/projectRepository";
import { JsonProjectStorageService } from "@/infrastructure/projectStorageService";
import { JsonWorkspaceStorageService } from "@/infrastructure/workspaceStorageService";
import { Result } from "@/shared/types/result";

import { Project } from "./application/project";
import { Workspace } from "./application/workspace";
import { ProjectManager } from "./manager/projectManager";
import { WorkspaceManager } from "./manager/workspaceManager";

export class AppCore {
    private static _instance: AppCore;
    private isLoaded: boolean = false;
    public readonly projectManager: ProjectManager;
    public readonly workspaceManager: WorkspaceManager;

    private constructor() {
        const projectRepo = new JsonProjectRepository();
        const projectStorageService = new JsonProjectStorageService();
        this.projectManager = new ProjectManager(projectRepo, projectStorageService);

        this.workspaceManager = new WorkspaceManager();
    }

    public async load(): Promise<Result> {
        if (this.isLoaded) return { status: "Error", message: "AppCore already loaded" };
        await AppCore.getIns().projectManager.load();
        this.isLoaded = true;
        return { status: "Success", data: null };
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

    public static getCurrentProject(): Project {
        const currentProject = AppCore.getIns().projectManager.currentProject;
        if (!currentProject) throw new Error("Current project not found");
        return currentProject;
    }

    public static getCurrentWorkspace(): Workspace {
        const currentWorkspace = AppCore.getIns().workspaceManager.currentWorkspace;
        if (!currentWorkspace) throw new Error("Current workspace not found");
        return currentWorkspace;
    }
}