import { SelectionState, TilesetSessionData, ViewState } from "@/shared/schema/tilesetSession";

import { Tileset } from "../tile/tileset";

export class TilesetSession {
    public id: string;
    public tileset: Tileset;
    public viewState: ViewState;
    public selectionState: SelectionState;
    constructor(tileset: Tileset, tilesetSessionData: TilesetSessionData) {
        this.tileset = tileset;
        this.id = tilesetSessionData.id;
        this.viewState = tilesetSessionData.viewState;
        this.selectionState = tilesetSessionData.selectionState || { selectedTiles: [] };
    }
    public updateViewState(state: Partial<ViewState>) {
        this.viewState = { ...this.viewState, ...state };
    }

    public updateSelectionState(state: Partial<SelectionState>) {
        this.selectionState = { ...this.selectionState, ...state };
    }

    public serialize(): TilesetSessionData {
        const selectionState: SelectionState = {
            selectedTiles: this.selectionState.selectedTiles,
            pivot: this.selectionState.pivot || undefined,
        }
        return {
            id: this.id,
            tilesetId: this.tileset.id,
            viewState: this.viewState,
            selectionState: selectionState,
        }
    }
}