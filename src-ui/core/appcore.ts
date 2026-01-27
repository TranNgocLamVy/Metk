import "./command/system/index";

import { JsonProjectRepository } from "@/infrastructure/projectRepository";
import { JsonProjectStorageService } from "@/infrastructure/projectStorageService";

import { EditorContext } from "./application/editorContext";
import { KeybindingManager } from "./manager/keybindingManager";
import { ProjectManager } from "./manager/projectManager";
import { SystemCommandManager } from "./manager/SystemCommandManager";
import { ToolManager } from "./manager/toolManager";
import { WorkspaceManager } from "./manager/workspaceManager";

export class AppCore {
    private static _instance: AppCore;
    private isLoaded: boolean = false;
    public readonly projectManager: ProjectManager;
    public readonly workspaceManager: WorkspaceManager;
    public commandManager: SystemCommandManager;
    private keybindingManager: KeybindingManager;

    public readonly editorContext: EditorContext;

    public readonly brushManager: ToolManager;

    private constructor() {
        const projectRepo = new JsonProjectRepository();
        const projectStorageService = new JsonProjectStorageService();

        // Init Managers
        this.projectManager = new ProjectManager(projectRepo, projectStorageService);
        this.workspaceManager = new WorkspaceManager();
        this.editorContext = new EditorContext(this.projectManager, this.workspaceManager);

        this.commandManager = new SystemCommandManager(this.editorContext);
        this.keybindingManager = new KeybindingManager(this.commandManager);
        this.brushManager = new ToolManager(this.editorContext);
        
        // Set Context
        this.workspaceManager.setEditorContext(this.editorContext);
    }

    public async load(): Promise<void> {
        if (this.isLoaded) return;
        await AppCore.getIns().projectManager.load();
        this.isLoaded = true;
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