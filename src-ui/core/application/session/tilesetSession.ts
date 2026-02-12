import { IBaseSession } from "@/core/interface/IBaseSession";
import { HistoryManager } from "@/core/manager/historyManager";
import { SelectionState } from "@/shared/schema/common/selectionState";
import { ViewState } from "@/shared/schema/common/viewState";
import { TilesetSessionData } from "@/shared/schema/tilesetSessionSchema";

import { Tile, Tileset } from "../tile/tileset";
import { TilesetSessionView } from "./tilesetSessionView";

export class TilesetSession implements IBaseSession {
    public readonly id: string;
    public readonly tileset: Tileset;
    public viewState: ViewState;
    public selectionState: SelectionState;
    private selectedTiles: (Tile | null)[][] = [];
    private pivot: Coordinate | null = null;

    public historyManager: HistoryManager;

    public sessionView: TilesetSessionView;


    constructor(tileset: Tileset, tilesetSessionData: TilesetSessionData) {
        this.tileset = tileset;
        this.id = tilesetSessionData.id;
        this.viewState = tilesetSessionData.viewState;
        this.selectionState = tilesetSessionData.selectionState || { selectedTiles: [] };

        this.historyManager = new HistoryManager();

        this.sessionView = new TilesetSessionView(this);
    }

    public updateViewState(state: Partial<ViewState>) {
        this.viewState = { ...this.viewState, ...state };
    }

    public updateSelectionState(state: Partial<SelectionState>) {
        this.selectionState = { ...this.selectionState, ...state };
    }

    public updatePivot(pivot: Coordinate | null) {
        this.pivot = pivot;
    }

    public getPivot(): Coordinate | null {
        return this.pivot ? this.pivot : null;
    }

    public serialize(): TilesetSessionData {
        const selectionState: SelectionState = {
            selectedTilesSet: this.selectionState.selectedTilesSet,
            pivot: this.selectionState.pivot || undefined,
        }
        return {
            id: this.id,
            tilesetId: this.tileset.id,
            viewState: this.viewState,
            selectionState: selectionState,
        }
    }

    public destroy(): void {
        this.sessionView.unActivateSession();
        this.sessionView.destroy();
    }
}