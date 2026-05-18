import { WorkspaceManager } from "@/application/workspace/workspace.manager";
import { TilemapSession } from "@/editor/session/tilemap.session";
import { TilesetSession } from "@/editor/session/tileset.session";
import { Workspace } from "@/editor/model/workspace/workspace";
import { TilemapView } from "@/graphics/view/tilemap.view";
import { TilesetView } from "@/graphics/view/tileset.view";
import { ProjectManager } from "./resources/project/project.manager";
import { Project } from "@/editor/model/project/project";
import { ToolManager } from "@/graphics/tool/tool.manager";
import { TextureManager } from "@/graphics/texture/texture.manager";
import { HistoryManager } from "./resources/history/history.manager";

export class EditorFacade {
    constructor(
        public readonly projectManager: ProjectManager,
        public readonly workspaceManager: WorkspaceManager,
        public readonly toolManager: ToolManager,
        public readonly textureManager: TextureManager
    ) { }

    public get currentProject(): Project | null {
        return this.projectManager.currentProject;
    }

    public get currentWorkspace(): Workspace | null {
        return this.workspaceManager.currentWorkspace;
    }

    public getActiveTilemapSession(): TilemapSession | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) return null;
        const currentTilemapSession = currentWorkspace.tilemapSessionManager.activeSession;
        if (!currentTilemapSession) return null;
        return currentTilemapSession;
    }

    public getActiveTilemapView(): TilemapView | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) return null;
        return currentWorkspace.tilemapSessionManager.getActiveView();
    }

    public getActiveTilesetSession(): TilesetSession | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) return null;
        const currentTilesetSession = currentWorkspace.tilesetSessionManager.activeSession;
        if (!currentTilesetSession) return null;
        return currentTilesetSession;
    }

    public getActiveTilesetView(): TilesetView | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) return null;
        return currentWorkspace.tilesetSessionManager.getActiveView();
    }

    public getCurrentHistoryManager(): HistoryManager | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) return null;
        const currentMapSession = currentWorkspace.tilemapSessionManager.activeSession;
        if (!currentMapSession) return null;
        return currentMapSession.historyManager;
    }
}