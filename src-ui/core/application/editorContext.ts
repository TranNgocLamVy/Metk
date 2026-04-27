import EventEmitter from "eventemitter3";

import { HistoryManager } from "../manager/historyManager";
import { ProjectManager } from "../manager/projectManager";
import { ToolManager } from "../manager/toolManager";
import { WorkspaceManager } from "../manager/workspaceManager";
import { Project } from "./project";
import { TilemapSession } from "./session/tilemapSession";
import { TilesetSession } from "./session/tilesetSession";
import { Tile } from "./tile/tileset";
import { Workspace } from "./workspace";
import { TextureManager } from "../manager/textureManager";
import { Ruleset } from "./rule/ruleset";
import { TilemapView } from "./view/tilemapView";
import { TilesetView } from "./view/tilesetView";

type EditorContextEvent = {
    onOpenTilemapSession: () => void,
}

export class EditorContext {
    public eventEmitter = new EventEmitter<EditorContextEvent>();
    
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

    // Access the Tileset Session
    public getSelectedTile(): (Tile | null)[][] | null {
        const tilesetSessionManager = this.currentWorkspace?.tilesetSessionManager;
        if (!tilesetSessionManager) return null;
        const activeSession = tilesetSessionManager.getActiveView();
        if (!activeSession) return null;
        return activeSession.selector.getSelectedTiles();
    }

    public getSelectedRuleset(): Ruleset | null {
        const selectedRuleId = this.workspaceManager.currentWorkspace?.rulesetSessionManager.getSelectedRuleId();
        if (!selectedRuleId) return null;
        const currentProject = this.currentProject;
        if (!currentProject) return null;
        return currentProject.rulesetManager.getRulesetById(selectedRuleId);
    }

    public getPivot(): Coordinate | null {
        const currentTilesetSession = this.getActiveTilesetSession();
        if (!currentTilesetSession) return null;
        return currentTilesetSession.getPivot();
    }
}