import { defaultWorkspaceData } from "@/shared/data-types/workspace.data";
import { Result } from "@/shared/types/result";

import { Project } from "@/editor/model/project/project";
import { Workspace } from "@/editor/model/workspace/workspace";
import { WorkspaceStorageService } from "@/infrastructure/container";
import { PathUtils } from "@/shared/utils/path.utils";
import { Console } from "@/ui/notifications/console-gateway";
import EventEmitter from "eventemitter3";
import { EditorFacade } from "../editor.facade";

type WorkspaceManagerEvent = {
    onWorkspaceLoaded: (workspace: Workspace) => void;
    onWorkspaceUnloaded: () => void;
}

const WORKSPACE_SAVE_DEBOUNCE_MS = 1000;

export class WorkspaceManager extends EventEmitter<WorkspaceManagerEvent> {
    public currentWorkspace: Workspace | null = null;
    private editorFacade: EditorFacade;
    private saveTimeout: NodeJS.Timeout | null = null;

    public constructor() {
        super();
    }

    public setEditorContext(editorFacade: EditorFacade) {
        this.editorFacade = editorFacade;
    }

    public async loadWorkspace(project: Project): Promise<Result<Workspace>> {
        this.unloadWorkspace();
    
        const workspaceAbsPath = project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "session.json"));
    
        const workspace = await this.resolveWorkspace(project, workspaceAbsPath);
    
        this.currentWorkspace = workspace;
        await workspace.loadSession();
    
        this.emit("onWorkspaceLoaded", workspace);
    
        return Result.Success(workspace);
    }
    
    private async resolveWorkspace(project: Project, workspaceAbsPath: string): Promise<Workspace> {
        const workspaceExists = await WorkspaceStorageService.exists(workspaceAbsPath);
    
        if (!workspaceExists) {
            const workspace = new Workspace(defaultWorkspaceData, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorFacade);
            this.currentWorkspace = workspace;
            await this.saveCurrentWorkspace();
            return workspace;
        }
    
        const loadSessionResult = await WorkspaceStorageService.load(workspaceAbsPath);
    
        if (loadSessionResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.workspace.loadFailFallback",
                stacks: loadSessionResult.message ? [loadSessionResult.message] : [],
            });
    
            const workspace = new Workspace(defaultWorkspaceData, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorFacade);
            this.currentWorkspace = workspace;
            await this.saveCurrentWorkspace();
            return workspace;
        }
    
        const workspaceResult = Workspace.createFromFileData(loadSessionResult.data,project.tilesetManager,project.tilemapManager,project.projectPathSystem,this.editorFacade);
    
        if (workspaceResult.status === Result.Status.Success) {
            return workspaceResult.data;
        }
    
        Console.error({
            message: "message.workspace.invalidFallback",
            stacks: workspaceResult.message ? [workspaceResult.message] : [],
        });
    
        return new Workspace(defaultWorkspaceData, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorFacade);
    }

    public async saveCurrentWorkspace(waitForTimeout: boolean = true): Promise<Result> {
        if (!waitForTimeout) return await this.performSaveWorkspace();

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.performSaveWorkspace();
        }, WORKSPACE_SAVE_DEBOUNCE_MS);

        return Result.Success();
    }

    private async performSaveWorkspace(): Promise<Result> {
        if (!this.currentWorkspace) return Result.Cancel();
        const workspaceData = this.currentWorkspace.serialize();
        const workspaceAbsPath = this.currentWorkspace.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "session.json"));
        return await WorkspaceStorageService.save(workspaceAbsPath, workspaceData);
    }

    public async unloadWorkspace(): Promise<void> {
        if (!this.currentWorkspace) return;
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        await this.currentWorkspace.destroy();
        this.currentWorkspace = null;
        this.emit("onWorkspaceUnloaded");
    }
}
