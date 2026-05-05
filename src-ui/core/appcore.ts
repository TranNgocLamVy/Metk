import "./command/system/index";
import "./tool/index";

import { EditorContext } from "./application/editorContext";
import { KeybindingManager } from "./manager/keybindingManager";
import { ProjectManager } from "./manager/projectManager";
import { SystemCommandManager } from "./manager/systemCommandManager";
import { ToolManager } from "./manager/toolManager";
import { WorkspaceManager } from "./manager/workspaceManager";
import { ProjectMetadataRepo } from "@/infrastructure/container";
import { Result } from "@/shared/types/result";
import { TextureManager } from "./manager/textureManager";
import { ContextManager } from "./manager/contextManager";
import { LayoutManager } from "./manager/layoutManager";


export class AppCore {
    private static _instance: AppCore;
    private isLoaded: boolean = false;
    public readonly projectManager: ProjectManager;
    public readonly workspaceManager: WorkspaceManager;
    public readonly layoutManager: LayoutManager;
    public readonly systemCommandManager: SystemCommandManager;
    public readonly toolManager: ToolManager;
    public readonly contextManager: ContextManager;
    public readonly keybindingManager: KeybindingManager;
    public readonly textureManager: TextureManager;

    public readonly editorContext: EditorContext;


    private constructor() {
        // Init Managers
        this.projectManager = new ProjectManager();
        this.workspaceManager = new WorkspaceManager();
        this.layoutManager = new LayoutManager();
        this.toolManager = new ToolManager();
        this.textureManager = new TextureManager();
        this.editorContext = new EditorContext(this.projectManager, this.workspaceManager, this.toolManager, this.textureManager);

        this.contextManager = new ContextManager();
        this.systemCommandManager = new SystemCommandManager(this.contextManager, this.editorContext);
        this.keybindingManager = new KeybindingManager(this.systemCommandManager, this.toolManager);
        
        // Set Context
        this.toolManager.setEditorContext(this.editorContext);
        this.workspaceManager.setEditorContext(this.editorContext);
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

    public async load(): Promise<Result<AppCore>> {
        if (this.isLoaded) return Result.Success(this);

        const projectRepoResult = await ProjectMetadataRepo.load('projects.json');

        if (projectRepoResult.status !== Result.Status.Success) {
            AppCore.getIns().projectManager.load([]);
            return Result.Error("Failed to load project repository");
        }

        const projectRepoData = projectRepoResult.data;
        AppCore.getIns().projectManager.load(projectRepoData);

        this.isLoaded = true;
        return Result.Success(this);
    }

    public async saveProjectManager(): Promise<Result> {
        const data = this.projectManager.serialize();
        return await ProjectMetadataRepo.save("projects.json", data);
    }
}

export const appCore = AppCore.getIns();