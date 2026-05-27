import { Application } from "pixi.js";

import { IBaseView } from "@/editor/interface/base-session.interface";
import { TilesetSession } from "@/editor/session/tileset.session";

import { CollectionImageTilesetView } from "./collection-tileset.view";
import { SingleImageTilesetView } from "./single-tileset.view";

export class TilesetView implements ITilesetView {
    private readonly view: ITilesetView;
    public readonly session: TilesetSession;

    constructor(session: TilesetSession) {
        this.view = session.tileset.type === "image-collection" ? new CollectionImageTilesetView(session) : new SingleImageTilesetView(session);
        this.session = session;
    }

    public get gridEnabled(): boolean {
        return this.view.gridEnabled;
    }

    public toggleGrid(): void {
        this.view.toggleGrid();
    }


    public activateView(pixiApp: Application): void {
        this.view.activateView(pixiApp);
    }

    public unActivateView(): void {
        this.view.unActivateView();
    }

    public destroy(): void {
        this.view.destroy();
    }
}

export interface ITilesetView extends IBaseView {
    readonly session: TilesetSession;
    gridEnabled: boolean;
    toggleGrid(): void;
}