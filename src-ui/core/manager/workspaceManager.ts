import { JsonWorkspaceStorageService } from "@/infrastructure/workspaceStorageService";
import { WorkpsaceData } from "@/shared/schema/workspace";
import { Result } from "@/shared/types/result";

import { EditorContext } from "../application/editorContext";
import { Project } from "../application/project";
import { Workspace } from "../application/workspace";

export class WorkspaceManager {
    public currentWorkspace: Workspace | null = null;
    private editorContext: EditorContext;
    public constructor() { }

    public setEditorContext(editorContext: EditorContext) {
        this.editorContext = editorContext;
    }

    public async saveCurrentWorkspace(): Promise<Result> {
        if (!this.currentWorkspace) return { status: "Error", message: "No current workspace" };
        return await this.currentWorkspace.save();
    }

    public async loadProjectWorkspace(project: Project): Promise<Result> {
        if (this.currentWorkspace) await this.currentWorkspace.unload();
        this.currentWorkspace = null;
        
        const workspaceStorageService = new JsonWorkspaceStorageService(project.metaData.directory);
        const loadSessionResult = await workspaceStorageService.loadWorkspace();
        if (loadSessionResult.status === "Success") {
            this.currentWorkspace = new Workspace(loadSessionResult.data, project.tilesetManager, project.tilemapManager, workspaceStorageService, this.editorContext);
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
                }
            }
            this.currentWorkspace = new Workspace(defaultWorkspaceData, project.tilesetManager, project.tilemapManager, workspaceStorageService, this.editorContext);
        }
        await this.currentWorkspace.load();
        return { status: "Success", data: null };
    }
}