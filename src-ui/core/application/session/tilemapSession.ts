import { IBaseSession } from "@/core/interface/IBaseSession";
import { HistoryManager } from "@/core/manager/historyManager";
import { ViewState } from "@/shared/schema/common/viewState";
import { LayerState, TilemapSessionData } from "@/shared/schema/tilemapSession";

import { EditorContext } from "../editorContext";
import { Tilemap } from "../tile/tilemap";

export class TilemapSession implements IBaseSession {
    public readonly id: string;
    public readonly historyManager: HistoryManager;
    
    public viewState: ViewState;
    public layerState: LayerState;

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
}