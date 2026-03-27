import { WorkpsaceData } from "@/shared/schema/workspaceSchema";
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

    // public async saveCurrentWorkspace(): Promise<Result> {
    //     if (!this.currentWorkspace) return { status: "Error", message: "No current workspace" };
    //     return await this.currentWorkspace.save();
    // }

    public async loadProjectWorkspace(project: Project): Promise<Result> {
        if (this.currentWorkspace) await this.currentWorkspace.unload();
        this.currentWorkspace = null;

        const workspaceAbsPath = project.projectPathSystem.getAbsPathFromRelPath("session.ss.json");
        const loadSessionResult = await WorkspaceStorageService.load(workspaceAbsPath);
        if (loadSessionResult.status === "Success") {
            this.currentWorkspace = new Workspace(loadSessionResult.data, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorContext);
        } else {
            const defaultWorkspaceData: WorkpsaceData = {
                tilesets: {
                    tilesetSessions: [],
                    currentTilesetSessionId: null,
                },
                tilemaps: {
                    tilemapSessions: [],
                    currentTilemapSessionId: null,
                },
                toolState: {
                    currentTool: undefined,
                },
                exportPaths: [],
            }
            this.currentWorkspace = new Workspace(defaultWorkspaceData, project.tilesetManager, project.tilemapManager, project.projectPathSystem, this.editorContext);
        }
        await this.currentWorkspace.load();
        return { status: "Success", data: null };
    }

    public async saveCurrentWorkspace(): Promise<Result> {
        if (!this.currentWorkspace) return Result.Error("No current workspace");
        const workspaceData = this.currentWorkspace.serialize();
        const workspaceAbsPath = this.currentWorkspace.projectPathSystem.getAbsPathFromRelPath("session.ss.json");
        return await WorkspaceStorageService.save(workspaceAbsPath, workspaceData);
    }
}