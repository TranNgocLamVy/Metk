import { IBaseSession } from "@/core/interface/IBaseSession";
import { HistoryManager } from "@/core/manager/historyManager";
import { ViewState } from "@/shared/schema/viewState";
import { LayerState, TilemapSessionData } from "@/shared/schema/tilemapSessionSchema";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";

import { EditorContext } from "../editorContext";
import { Tilemap } from "../tile/tilemap";
import { TilemapSessionView } from "./tilemapSessionView";
import { Tile, Tileset } from "../tile/tileset";

export class TilemapSession implements IBaseSession {
    public readonly id: string;

    public isDirty: boolean;

    public readonly historyManager: HistoryManager;

    public viewState: ViewState;
    public layerState: LayerState;

    public sessionView: TilemapSessionView;

    private bindOnTilemapChange: () => void;

    constructor(
        public readonly tilemap: Tilemap,
        tilemapSessionData: TilemapSessionData,
        public readonly editorContext: EditorContext
    ) {
        this.id = tilemapSessionData.id;
        this.tilemap = tilemap;

        this.historyManager = new HistoryManager();

        this.viewState = tilemapSessionData.viewState ?? { x: null, y: null, zoom: 1 };
        this.layerState = tilemapSessionData.layerState ?? { selectedLayers: [] };

        this.sessionView = new TilemapSessionView(this);

        this.bindOnTilemapChange = this.markAsDirty.bind(this);
        this.tilemap.eventEmitter.on("updateProperty", this.bindOnTilemapChange);
    }

    public async loadTilemapSession(): Promise<void> {
        const tilesetIds = this.tilemap.tilesetRefManager.serialize().map(r => r.id);
        const tilesetManager = this.editorContext.getCurrentProject().tilesetManager;
        const tilesets: Tileset[] = [];
        for (const id of tilesetIds) {
            const tileset = tilesetManager.getTilesetById(id);
            if (tileset) tilesets.push(tileset);
        }
        const textureManager = this.editorContext.textureManager;
        await Promise.all(tilesets.map(t => textureManager.retainTilesetGraphics(t)));
    }

    //==========View State==========
    public updateViewState(state: Partial<ViewState>) {
        this.viewState = { ...this.viewState, ...state };
    }

    //==========Layer State==========
    public updateLayerState(state: Partial<LayerState>) {
        this.layerState = { ...this.layerState, ...state };
    }

    public serialize(): TilemapSessionData {
        return {
            id: this.id,
            tilemapId: this.tilemap.id,
            viewState: this.viewState,
            layerState: this.layerState
        }
    }

    public markAsDirty(): void {
        this.isDirty = true;
        useTilemapSessionStore.getState().refresh();
    }

    public markAsClean(): void {
        this.isDirty = false;
        useTilemapSessionStore.getState().refresh();
    }

    public destroy() {
        const tilesetIds = this.tilemap.tilesetRefManager.serialize().map(r => r.id);
        const textureManager = this.editorContext.textureManager;
        for (const id of tilesetIds) textureManager.releaseTilesetGraphics(id);

        this.sessionView.unActivateSession();
        this.sessionView.destroy();
    }
}