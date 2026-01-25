import { IBaseSession } from "@/core/interface/IBaseSession";
import { HistoryManager } from "@/core/manager/historyManager";
import { ViewState } from "@/shared/schema/common/viewState";
import { LayerState, TilemapSessionData } from "@/shared/schema/tilemapSession";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";

import { EditorContext } from "../editorContext";
import { Tilemap } from "../tile/tilemap";
import { TilemapSessionView } from "./tilemapSessionView";

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

        this.bindOnTilemapChange = this.onTilemapChange.bind(this);
        this.tilemap.eventEmitter.on("onChange", this.bindOnTilemapChange);
        this.tilemap.eventEmitter.on("updateProperty", this.bindOnTilemapChange);
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

    public onTilemapChange(): void {
        this.isDirty = true;
        useTilemapSessionStore.getState().refresh();
    }

    public destroy() {
        this.sessionView.unActivateSession();
        this.sessionView.destroy();
    }
}