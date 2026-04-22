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
import { TextureManager } from "../manager/textureManager";
import { Ruleset } from "./rule/ruleset";

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

    public getToolManager(): ToolManager {
        return this.toolManager;
    }

    public getCurrentTilemapSession(): TilemapSession | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) return null;
        const currentTilemapSession = currentWorkspace.tilemapSessionManager.currentTilemapSession;
        if (!currentTilemapSession) return null;
        return currentTilemapSession;
    }

    public getCurrentTilesetSession(): TilesetSession | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) return null;
        const currentTilesetSession = currentWorkspace.tilesetSessionManager.currentTilesetSession;
        if (!currentTilesetSession) return null;
        return currentTilesetSession;
    }

    public getCurrentHistoryManager(): HistoryManager | null {
        const currentWorkspace = this.workspaceManager.currentWorkspace;
        if (!currentWorkspace) return null;
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

    public getSelectedRuleset(): Ruleset | null {
        const selectedRuleId = this.workspaceManager.currentWorkspace?.rulesetSessionManager.getSelectedRuleId();
        if (!selectedRuleId) return null;
        const currentProject = this.currentProject;
        if (!currentProject) return null;
        return currentProject.rulesetManager.getRulesetById(selectedRuleId);
    }

    public getPivot(): Coordinate | null {
        const currentTilesetSession = this.getCurrentTilesetSession();
        if (!currentTilesetSession) return null;
        return currentTilesetSession.getPivot();
    }
}