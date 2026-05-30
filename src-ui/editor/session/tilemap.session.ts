import { IBaseSession } from "@/editor/interface/base-session.interface";
import { ViewState } from "@/shared/data-types/view-state.data";
import { LayerState, TilemapSessionData } from "@/shared/data-types/tilemap-session.data";

import { EditorFacade } from "@/application/editor.facade";
import EventEmitter from "eventemitter3";
import { Tilemap } from "../model/tilemap/tilemap";
import { Tileset } from "../model/tileset/tileset";
import { HistoryManager } from "@/application/resources/history/history.manager";
import { TilemapChangeObserver } from "./tilemap-change.observer";

interface TilemapSessionEvents {
    onMarkChange: (isDirty: boolean) => void;
    onSelectedLayersChanged: (layerIds: string[]) => void;
}

export class TilemapSession extends EventEmitter<TilemapSessionEvents> implements IBaseSession {
    public readonly id: string;

    public isDirty: boolean;

    public readonly historyManager: HistoryManager;

    public viewState: ViewState;
    public layerState: LayerState;

    private readonly changeObserver: TilemapChangeObserver;

    constructor(
        public readonly tilemap: Tilemap,
        tilemapSessionData: TilemapSessionData,
        public readonly editorFacade: EditorFacade
    ) {
        super();
        this.id = tilemapSessionData.id;
        this.tilemap = tilemap;

        this.historyManager = new HistoryManager();

        this.viewState = tilemapSessionData.viewState ?? { x: null, y: null, zoom: 1 };

        const layers = Array.from(this.tilemap.rootLayer.getAllIds());
        const selectedLayers = tilemapSessionData.layerState?.selectedLayers ?? [];
        this.layerState = {
            selectedLayers: layers.filter(id => selectedLayers.includes(id))
        }

        this.changeObserver = new TilemapChangeObserver(this, this.tilemap);
        this.changeObserver.bind();
    }

    public async loadTilemapSession(): Promise<void> {
        const tilesetIds = this.tilemap.tilesetRefManager.getRefIds();
        const currentProject = this.editorFacade.currentProject;
        if (!currentProject) return;
        const tilesetManager = currentProject.tilesetManager;
        const tilesets: Tileset[] = [];
        for (const id of tilesetIds) {
            const tileset = tilesetManager.getTilesetById(id);
            if (tileset) tilesets.push(tileset);
        }
        const textureManager = this.editorFacade.textureManager;
        await Promise.all(tilesets.map(t => textureManager.retainTilesetGraphics(t)));
    }

    //==========View State==========
    public updateViewState(state: Partial<ViewState>) {
        this.viewState = { ...this.viewState, ...state };
    }

    //==========Layer State==========
    public updateLayerState(state: Partial<LayerState>) {
        this.layerState = { ...this.layerState, ...state };
        this.emit("onSelectedLayersChanged", this.layerState.selectedLayers);
    }

    public reconcileSelectedLayersWithLayerTree(): void {
        const layers = Array.from(this.tilemap.rootLayer.getAllIds());
        const selectedLayers = this.layerState.selectedLayers.filter(id => layers.includes(id));

        if (
            selectedLayers.length === this.layerState.selectedLayers.length
            && selectedLayers.every((id, index) => id === this.layerState.selectedLayers[index])
        ) {
            return;
        }

        this.updateLayerState({ selectedLayers });
    }

    public markAsDirty(): void {
        this.isDirty = true;
        this.emit("onMarkChange", this.isDirty);
    }

    public markLayerChange(): void {
        this.isDirty = true;
        this.emit("onMarkChange", this.isDirty);
    }

    public markAsClean(): void {
        this.isDirty = false;
        this.emit("onMarkChange", this.isDirty);
    }

    public serialize(): TilemapSessionData {
        return {
            id: this.id,
            tilemapId: this.tilemap.id,
            viewState: this.viewState,
            layerState: this.layerState
        }
    }

    public destroy() {
        this.changeObserver.unbind();

        const tilesetIds = this.tilemap.tilesetRefManager.getRefIds();
        const textureManager = this.editorFacade.textureManager;
        for (const id of tilesetIds) textureManager.releaseTilesetGraphics(id); // TODO: Move this to view
    }
}
