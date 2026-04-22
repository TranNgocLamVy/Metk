import { defaultWorkspaceData } from "@/shared/schema/workspaceSchema";
import { Result } from "@/shared/types/result";

import { EditorContext } from "../application/editorContext";
import { Project } from "../application/project";
import { Workspace } from "../application/workspace";
import { WorkspaceStorageService } from "@/infrastructure/container";

export class WorkspaceManager {
    public currentWorkspace: Workspace | null = null;
    private editorContext: EditorContext;
    public constructor() { }

    public setEditorContext(editorContext: EditorContext) {
        this.editorContext = editorContext;
    }

    public async loadProjectWorkspace(project: Project): Promise<Result<Workspace>> {
        if (this.currentWorkspace) await this.currentWorkspace.destroy();
        this.currentWorkspace = null;

        const workspaceAbsPath = project.projectPathSystem.getAbsPathFromRelPath("session.ss.json");
        const loadSessionResult = await WorkspaceStorageService.load(workspaceAbsPath);
        if (loadSessionResult.status === Result.Status.Success) {
            this.currentWorkspace = new Workspace(loadSessionResult.data, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorContext);
        } else {
            this.currentWorkspace = new Workspace(defaultWorkspaceData, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorContext);
        }
        await this.currentWorkspace.loadSession();
        return Result.Success(this.currentWorkspace!);
    }

    public async unloadWorkspace(): Promise<void> {
        if (!this.currentWorkspace) return;
        await this.currentWorkspace.destroy();
        this.currentWorkspace = null;
    }

    public async saveCurrentWorkspace(): Promise<Result> {
        if (!this.currentWorkspace) return Result.Error("No current workspace");
        const workspaceData = this.currentWorkspace.serialize();
        const workspaceAbsPath = this.currentWorkspace.projectPathSystem.getAbsPathFromRelPath("session.ss.json");
        return await WorkspaceStorageService.save(workspaceAbsPath, workspaceData);
    }
}