import { defaultWorkspaceData } from "@/shared/schema/workspaceSchema";
import { Result } from "@/shared/types/result";

import { EditorFacade } from "../editor.facade";
import { Workspace } from "@/editor/model/workspace/workspace";
import { WorkspaceStorageService } from "@/infrastructure/container";
import { PathUtils } from "@/shared/utils/path.utils";
import EventEmitter from "eventemitter3";
import { Project } from "@/editor/model/project/project";

type WorkspaceManagerEvent = {
    onWorkspaceLoaded: (workspace: Workspace) => void;
    onWorkspaceUnloaded: () => void;
}

export class WorkspaceManager extends EventEmitter<WorkspaceManagerEvent> {
    public currentWorkspace: Workspace | null = null;
    private editorContext: EditorFacade;
    private saveTimeout: NodeJS.Timeout | null = null;

    public constructor() {
        super();
    }

    public setEditorContext(editorContext: EditorFacade) {
        this.editorContext = editorContext;
    }

    public async loadProjectWorkspace(project: Project): Promise<Result<Workspace>> {
        if (this.currentWorkspace) await this.currentWorkspace.destroy();
        this.currentWorkspace = null;

        const workspaceAbsPath = project.projectPathSystem.getAbsPathFromRelPath(PathUtils.join(".metk", "session.json"));

        const workspaceExist = await WorkspaceStorageService.exists(workspaceAbsPath);
        if (!workspaceExist) {
            this.currentWorkspace = new Workspace(defaultWorkspaceData, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorContext);
            await this.saveCurrentWorkspace();
        } else {            
            const loadSessionResult = await WorkspaceStorageService.load(workspaceAbsPath);
            if (loadSessionResult.status === Result.Status.Success) {
                this.currentWorkspace = new Workspace(loadSessionResult.data, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorContext);
            } else {
                this.currentWorkspace = new Workspace(defaultWorkspaceData, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorContext);
                await this.saveCurrentWorkspace();
            }
        }
        await this.currentWorkspace.loadSession();
        this.emit("onWorkspaceLoaded", this.currentWorkspace);
        return Result.Success(this.currentWorkspace!);
    }

    public async saveCurrentWorkspace(waitForTimeout: boolean = true): Promise<Result> {
        if (!waitForTimeout) return await this.performSaveWorkspace();

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => {
            this.performSaveWorkspace();
        }, 1000);

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