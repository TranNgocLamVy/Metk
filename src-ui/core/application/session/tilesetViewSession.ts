import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";

import { TilesetViewSessionData } from "@/shared/schema/session";

import { TilesetRenderer } from "../renderer/tilesetViewRenderer";
import { Tileset } from "../tile/tileset";

export class TilesetViewSession {
    public id: string;
    public tileset: Tileset;
    private renderer: TilesetRenderer;

    private viewport: Viewport;

    constructor(tileset: Tileset, tilesetViewSessionData: TilesetViewSessionData) {
        this.tileset = tileset;
        this.id = tilesetViewSessionData.id;
    }

    public serialize(): any {

    }

    public async activateSession(pixiApp: Application) {
        await this.tileset.loadTexture();
        this.initialize(pixiApp);
    }

    private async initialize(pixiApp: Application): Promise<void> {
        this.viewport = new Viewport({
            screenWidth: pixiApp.screen.width,
            screenHeight: pixiApp.screen.height,
            worldHeight: pixiApp.screen.height,

            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
        });
        this.viewport.drag({ mouseButtons: "middle" }).wheel().decelerate({ friction: 0 });
        this.viewport.eventMode = "static";
        this.viewport.hitArea = pixiApp.screen;

        pixiApp.stage.addChild(this.viewport);
        pixiApp.renderer.on("resize", () => {
            const w = pixiApp.renderer.width;
            const h = pixiApp.renderer.height;
            this.viewport.resize(w, h);
        });
        this.renderer = new TilesetRenderer({ tileset: this.tileset, parent: this.viewport });
    }

    public async unload() {

    }
}