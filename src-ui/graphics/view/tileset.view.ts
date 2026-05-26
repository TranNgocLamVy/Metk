import { Application } from "pixi.js";

import { IBaseView } from "@/editor/interface/base-session.interface";
import { TilesetSession } from "@/editor/session/tileset.session";

import { CollectionImageTilesetView } from "./collection-image-tileset.view";
import { SingleImageTilesetView } from "./single-image-tileset.view";

export class TilesetView implements IBaseView {
    private readonly view: IBaseView;

    constructor(session: TilesetSession) {
        this.view = session.tileset.type === "image-collection" ? new CollectionImageTilesetView(session) : new SingleImageTilesetView(session);
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