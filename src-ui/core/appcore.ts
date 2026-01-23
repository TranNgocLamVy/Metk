

import { JsonProjectRepository } from "@/infrastructure/projectRepository";
import { JsonProjectStorageService } from "@/infrastructure/projectStorageService";
import { Result } from "@/shared/types/result";

import { EditorContext } from "./application/editorContext";
import { ProjectManager } from "./manager/projectManager";
import { WorkspaceManager } from "./manager/workspaceManager";

export class AppCore {
    private static _instance: AppCore;
    private isLoaded: boolean = false;
    public readonly projectManager: ProjectManager;
    public readonly workspaceManager: WorkspaceManager;
    public readonly editorContext: EditorContext;

    private constructor() {
        const projectRepo = new JsonProjectRepository();
        const projectStorageService = new JsonProjectStorageService();

        // Init Managers
        this.projectManager = new ProjectManager(projectRepo, projectStorageService);
        this.workspaceManager = new WorkspaceManager();
        
        // Set Context
        this.editorContext = new EditorContext(this.projectManager, this.workspaceManager);
        this.workspaceManager.setEditorContext(this.editorContext);
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
}