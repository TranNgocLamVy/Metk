import "./command/system/index";
import "./tool/index";

import { EditorContext } from "./application/editorContext";
import { KeybindingManager } from "./manager/keybindingManager";
import { ProjectManager } from "./manager/projectManager";
import { SystemCommandManager } from "./manager/systemCommandManager";
import { ToolManager } from "./manager/toolManager";
import { WorkspaceManager } from "./manager/workspaceManager";

export class AppCore {
    private static _instance: AppCore;
    private isLoaded: boolean = false;
    public readonly projectManager: ProjectManager;
    public readonly workspaceManager: WorkspaceManager;
    public systemCommandManager: SystemCommandManager;
    public readonly toolManager: ToolManager;
    private keybindingManager: KeybindingManager;

    public readonly editorContext: EditorContext;


    private constructor() {
        // Init Managers
        this.projectManager = new ProjectManager();
        this.workspaceManager = new WorkspaceManager();
        this.toolManager = new ToolManager();
        this.editorContext = new EditorContext(this.projectManager, this.workspaceManager, this.toolManager);

        this.systemCommandManager = new SystemCommandManager(this.editorContext);
        this.keybindingManager = new KeybindingManager(this.systemCommandManager, this.toolManager);
        
        // Set Context
        this.toolManager.setEditorContext(this.editorContext);
        this.workspaceManager.setEditorContext(this.editorContext);
    }

    public async load(): Promise<AppCore> {
        if (this.isLoaded) return this;
        await AppCore.getIns().projectManager.load();
        this.isLoaded = true;
        return this;
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