import { IWorkspacetorageService } from "@/infrastructure/interface/IWorkspaceStorageService";
import { WorkpsaceData } from "@/shared/schema/workspace";
import { Result } from "@/shared/types/result";

import { TilemapManager } from "../manager/tilemapManager";
import { TilemapSessionManager } from "../manager/tilemapSessionManager";
import { TilesetManager } from "../manager/tilesetManager";
import { TilesetSessionManager } from "../manager/tilesetSessionManager";
import { EditorContext } from "./editorContext";
import { TilemapSession } from "./session/tilemapSession";
import { TilesetSession } from "./session/tilesetSession";
import { Tilemap } from "./tile/tilemap";
import { Tileset } from "./tile/tileset";

export class Workspace {
    public tilesetSessionManager: TilesetSessionManager;
    public tilemapSessionManager: TilemapSessionManager;
    constructor (
        workspaceData: WorkpsaceData, 
        private readonly tilesetManager: TilesetManager, 
        private readonly tilemapManager: TilemapManager, 
        private readonly workspaceStorageService: IWorkspacetorageService,
        private readonly editorContext: EditorContext,
    ) {
        this.tilesetSessionManager = new TilesetSessionManager(workspaceData.tilesets, this.editorContext);
        this.tilemapSessionManager = new TilemapSessionManager(workspaceData.tilemaps, this.editorContext);
    }

    public async load(): Promise<Result> {
        await this.tilesetSessionManager.loadAll(this.tilesetManager);
        await this.tilemapSessionManager.loadAll(this.tilemapManager);
        return { status: "Success", data: null };
    }

    public async save(): Promise<Result> {
        const workspaceData = this.serialize();
        // console.log("Save workspace");
        return await this.workspaceStorageService.saveWorkspace(workspaceData);
    }

    public serialize(): WorkpsaceData {
        return {
            tilesets: this.tilesetSessionManager.serialize(),
            tilemaps: this.tilemapSessionManager.serialize(),
        }
    }
}