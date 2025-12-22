import { ViewState } from "@/shared/schema/common/viewState";
import { TilemapSessionData } from "@/shared/schema/tilemapSession";

import { Tilemap } from "../tile/tilemap";

export class TilemapSession {
    public readonly id: string;
    public readonly tilemap: Tilemap;

    public viewState: ViewState;
    constructor(tilemap: Tilemap, tilemapSessionData: TilemapSessionData) {
        this.tilemap = tilemap;
        this.id = tilemapSessionData.id;
        this.viewState = tilemapSessionData.viewState;
    }
    public updateViewState(state: Partial<ViewState>) {
        this.viewState = { ...this.viewState, ...state };
    }
    public serialize(): TilemapSessionData {
        return {
            id: this.id,
            tilemapId: this.tilemap.id,
            viewState: this.viewState,
        }
    }
}