import { TilesetSessionData, ViewState } from "@/shared/schema/tilesetSession";

import { Tileset } from "../tile/tileset";

export class TilesetSession {
    public id: string;
    public tileset: Tileset;
    public viewState: ViewState;;
    constructor(tileset: Tileset, tilesetSessionData: TilesetSessionData) {
        this.tileset = tileset;
        this.id = tilesetSessionData.id;
        this.viewState = tilesetSessionData.viewState;
    }
    public updateViewState(state: Partial<ViewState>) {
        this.viewState = { ...this.viewState, ...state };
    }

    public serialize(): TilesetSessionData {
        return {
            id: this.id,
            tilesetId: this.tileset.id,
            viewState: this.viewState,
        }
    }
}