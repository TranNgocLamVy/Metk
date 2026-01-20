import { ViewState } from "@/shared/schema/common/viewState";
import { LayerState, TilemapSessionData } from "@/shared/schema/tilemapSession";

import { Tilemap } from "../tile/tilemap";

export class TilemapSession {
    public readonly id: string;
    public readonly tilemap: Tilemap;

    public viewState: ViewState;
    public layerState: LayerState;

    constructor(tilemap: Tilemap, tilemapSessionData: TilemapSessionData) {
        this.tilemap = tilemap;
        this.id = tilemapSessionData.id;
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