import EventEmitter from "eventemitter3";

import { AppCore } from "../appcore";
import { HistoryManager } from "../manager/historyManager";
import { ProjectManager } from "../manager/projectManager";
import { ToolManager } from "../manager/toolManager";
import { WorkspaceManager } from "../manager/workspaceManager";
import { Project } from "./project";
import { TilemapSession } from "./session/tilemapSession";
import { TilesetSession } from "./session/tilesetSession";
import { Tile } from "./tile/tileset";
import { Workspace } from "./workspace";

type EditorContextEvent = {
    onOpenTilemapSession: () => void,
}

export class EditorContext {
    public eventEmitter = new EventEmitter<EditorContextEvent>();
    
    constructor(
        public readonly projectManager: ProjectManager,
        public readonly workspaceManager: WorkspaceManager,
        public readonly toolManager: ToolManager
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

    public getToolManager(): ToolManager {
        return this.toolManager;
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

    // Access the Tileset Session
    public getSelectedTile(): (Tile | null)[][] | null {
        const currentTilesetSession = this.getCurrentTilesetSession();
        if (!currentTilesetSession) return null;
        return currentTilesetSession.sessionView.selector.getSelectedTiles();
    }

    public getPivot(): Coordinate | null {
        const currentTilesetSession = this.getCurrentTilesetSession();
        if (!currentTilesetSession) return null;
        return currentTilesetSession.getPivot();
    }
}