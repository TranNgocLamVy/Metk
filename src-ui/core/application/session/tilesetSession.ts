import { TilesetSessionData } from "@/shared/schema/session";

import { Tileset } from "../tile/tileset";

export type ViewState = {
    x: number | null;
    y: number | null;
    zoom: number;
};

export class TilesetSession {
    public id: string;
    public tileset: Tileset;
    public viewState: ViewState = { x: null, y: null, zoom: 2 };
    constructor(tileset: Tileset, tilesetSessionData: TilesetSessionData) {
        this.tileset = tileset;
        this.id = tilesetSessionData.id;
    }
    public updateViewState(state: Partial<ViewState>) {
        console.log(this.id, state);
        this.viewState = { ...this.viewState, ...state };
    }
}