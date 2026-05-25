import "@/application/command-system/register-commands";
import "@/graphics/tool/register-tool";

import { EditorFacade } from "@/application/editor.facade";
import { KeybindingManager } from "@/application/input/keybinding.manager";
import { WorkspaceManager } from "@/application/workspace/workspace.manager";
import { ProjectMetadataRepo } from "@/infrastructure/container";
import { Result } from "@/shared/types/result";
import { ActivationContext } from "../runtime/activation-context";
import { LayoutManager } from "@/application/layout/layout.manager";
import { ProjectManager } from "@/application/resources/project/project.manager";
import { SystemCommandManager } from "@/application/commands/system-command.manager";
import { ToolManager } from "@/graphics/tool/tool.manager";
import { TextureManager } from "@/graphics/texture/texture.manager";


export class AppKernel {
    private static _instance: AppKernel;
    private isLoaded: boolean = false;
    public readonly projectManager: ProjectManager;
    public readonly workspaceManager: WorkspaceManager;
    public readonly layoutManager: LayoutManager;
    public readonly systemCommandManager: SystemCommandManager;
    public readonly toolManager: ToolManager;
    public readonly activationContext: ActivationContext;
    public readonly keybindingManager: KeybindingManager;
    public readonly textureManager: TextureManager;

    public readonly editorFacade: EditorFacade;


    private constructor() {
        // Init Managers
        this.projectManager = new ProjectManager();
        this.workspaceManager = new WorkspaceManager();
        this.layoutManager = new LayoutManager();
        this.toolManager = new ToolManager();
        this.textureManager = new TextureManager();
        this.activationContext = new ActivationContext();

        this.editorFacade = new EditorFacade(this.projectManager, this.workspaceManager, this.toolManager, this.textureManager, this.activationContext);

        this.systemCommandManager = new SystemCommandManager(this.activationContext, this.editorFacade);
        this.keybindingManager = new KeybindingManager(this.systemCommandManager, this.toolManager);
        
        // Set Context
        this.toolManager.setEditorContext(this.editorFacade);
        this.workspaceManager.setEditorContext(this.editorFacade);
    }

    public static initialize() {
        if (AppKernel._instance) return;
        const global = globalThis as any;
        if (import.meta.env.DEV && global.__APP_CORE_INSTANCE__) {
            AppKernel._instance = global.__APP_CORE_INSTANCE__;
            return;
        }
        AppKernel._instance = new AppKernel();
        if (import.meta.env.DEV) global.__APP_CORE_INSTANCE__ = AppKernel._instance;
    }

    public static getIns(): AppKernel {
        if (!this._instance) {
            this.initialize();
        }
        return this._instance;
    }

    public async load(): Promise<Result<AppKernel>> {
        if (this.isLoaded) return Result.Success(this);

        const projectRepoResult = await ProjectMetadataRepo.load('projects.json');

        if (projectRepoResult.status !== Result.Status.Success) {
            AppKernel.getIns().projectManager.load([]);
            return Result.Error("Failed to load project repository");
        }

        const projectRepoData = projectRepoResult.data;
        AppKernel.getIns().projectManager.load(projectRepoData);

        this.isLoaded = true;
        return Result.Success(this);
    }

    public async saveProjectManager(): Promise<Result> {
        const data = this.projectManager.serialize();
        return await ProjectMetadataRepo.save("projects.json", data);
    }
}

export const appKernel = AppKernel.getIns();