import { IBaseSession } from "@/core/interface/IBaseSession";
import { HistoryManager } from "@/core/manager/historyManager";
import { ViewState } from "@/shared/schema/viewState";
import { LayerState, TilemapSessionData } from "@/shared/schema/tilemapSessionSchema";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";

import { EditorContext } from "../editorContext";
import { Tilemap } from "../tile/tilemap";
import { TilemapSessionView } from "./tilemapSessionView";
import { Tileset } from "../tile/tileset";
import EventEmitter from "eventemitter3";

interface TilemapSessionEvents {
    onSelectedLayersChanged: (layerIds: string[]) => void;
}

export class TilemapSession implements IBaseSession {
    public readonly id: string;

    public isDirty: boolean;

    public readonly historyManager: HistoryManager;

    public viewState: ViewState;
    public layerState: LayerState;
    
    public eventEmitter: EventEmitter<TilemapSessionEvents>;

    private bindOnTilemapChange: () => void;

    constructor(
        public readonly tilemap: Tilemap,
        tilemapSessionData: TilemapSessionData,
        public readonly editorContext: EditorContext
    ) {
        this.id = tilemapSessionData.id;
        this.tilemap = tilemap;

        this.historyManager = new HistoryManager();
        this.eventEmitter = new EventEmitter<TilemapSessionEvents>();

        this.viewState = tilemapSessionData.viewState ?? { x: null, y: null, zoom: 1 };

        const layers = Array.from(this.tilemap.rootLayer.getAllIds());
        const selectedLayers = tilemapSessionData.layerState?.selectedLayers ?? [];
        this.layerState = {
            selectedLayers: layers.filter(id => selectedLayers.includes(id))
        }

        this.bindOnTilemapChange = this.markAsDirty.bind(this);
        this.tilemap.eventEmitter.on("updateProperty", this.bindOnTilemapChange);
    }

    public async loadTilemapSession(): Promise<void> {
        const tilesetIds = this.tilemap.tilesetRefManager.getRefIds();
        const currentProject = this.editorContext.currentProject;
        if (!currentProject) return;
        const tilesetManager = currentProject.tilesetManager;
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
        this.eventEmitter.emit("onSelectedLayersChanged", this.layerState.selectedLayers);
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

    public updateSelectedLayers() {
        const layers = Array.from(this.tilemap.rootLayer.getAllIds());
        const selectedLayers = this.layerState.selectedLayers;
        this.layerState = {
            selectedLayers: layers.filter(id => selectedLayers.includes(id))
        }
    }

    public destroy() {
        const tilesetIds = this.tilemap.tilesetRefManager.getRefIds();
        const textureManager = this.editorContext.textureManager;
        for (const id of tilesetIds) textureManager.releaseTilesetGraphics(id);
    }
}