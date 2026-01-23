import { HistoryManager } from "../manager/historyManager";
import { ProjectManager } from "../manager/projectManager";
import { WorkspaceManager } from "../manager/workspaceManager";
import { Project } from "./project";
import { TilemapSession } from "./session/tilemapSession";
import { TilesetSession } from "./session/tilesetSession";
import { Workspace } from "./workspace";

export class EditorContext {

    constructor(
        private readonly projectManager: ProjectManager,
        private readonly workspaceManager: WorkspaceManager
    ) { }

    public getCurrentProject(): Project {
        const currentProject = this.projectManager.currentProject;
        if (!currentProject) throw new Error("Current project not found");
        return currentProject;
    }

    public getCurrentWorkspace(): Workspace {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) throw new Error("Current workspace not found");
        return currentWorkspace;
    }

    public getCurrentTilemapSession(): TilemapSession | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) throw new Error("Current workspace not found");
        const currentTilemapSession = currentWorkspace.tilemapSessionManager.currentTilemapSession;
        if (!currentTilemapSession) return null;
        return currentTilemapSession;
    }

    public getCurrentTilesetSession(): TilesetSession | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) throw new Error("Current workspace not found");
        const currentTilesetSession = currentWorkspace.tilesetSessionManager.currentTilesetSession;
        if (!currentTilesetSession) return null;
        return currentTilesetSession;
    }

    public getCurrentHistoryManager(): HistoryManager | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) throw new Error("Current workspace not found");
        const currentMapSession = currentWorkspace.tilemapSessionManager.currentTilemapSession;
        if (!currentMapSession) return null;
        const historyManager = currentMapSession.historyManager;
        if (!historyManager) return null;
        return historyManager;
    }
}