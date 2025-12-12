import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";

import { TilesetRenderer } from "@/core/application/renderer/tilesetViewRenderer";
import { TilesetSession } from "@/core/application/session/tilesetSession";

export class TilesetSessionView {
    public session: TilesetSession;
    public viewport: Viewport;
    private renderer: TilesetRenderer;
    private pixiApp: Application; // Need to store this to remove global listeners later

    private bindMovedEnd: () => void;
    private bindZoomedEnd: () => void;
    private bindResize: () => void;

    constructor(session: TilesetSession, pixiApp: Application) {
        this.session = session;
        this.pixiApp = pixiApp;

        this.viewport = new Viewport({
            screenWidth: pixiApp.screen.width,
            screenHeight: pixiApp.screen.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
        });
        this.viewport.drag({ mouseButtons: "middle" }).wheel().decelerate({ friction: 0 });
        this.viewport.eventMode = "static";
        
        this.renderer = new TilesetRenderer({ tileset: session.tileset, parent: this.viewport });

        this.bindMovedEnd = this.onMovedEnd.bind(this);
        this.bindZoomedEnd = this.onZoomedEnd.bind(this);
        this.bindResize = this.onResize.bind(this);
    }

    private onMovedEnd = () => {
        this.session.updateViewState({
            x: this.viewport.center.x,
            y: this.viewport.center.y,
        });
    };

    private onZoomedEnd = () => {
        this.session.updateViewState({
            zoom: this.viewport.scaled
        });
    };

    private onResize = () => {
        const w = this.pixiApp.renderer.width;
        const h = this.pixiApp.renderer.height;
        this.viewport.resize(w, h);
    };
    // ---------------------------------------------

    public activateSession() {
        this.pixiApp.stage.addChild(this.viewport);
        const center = this.viewport.center;
        
        // Restore view state
        this.viewport.moveCenter(this.session.viewState.x ?? center.x, this.session.viewState.y ?? center.y);
        const targetZoom = this.session.viewState.zoom || 1;
        this.viewport.setZoom(targetZoom);

        // Add Listeners
        this.viewport.on("moved-end", this.bindMovedEnd);
        this.viewport.on("zoomed-end", this.bindZoomedEnd);
        this.pixiApp.renderer.on("resize", this.bindResize);
    }

    public unActivateSession() {
        this.pixiApp.stage.removeChild(this.viewport);
        this.viewport.off("moved-end", this.bindMovedEnd);
        this.viewport.off("zoomed-end", this.bindZoomedEnd);
        this.pixiApp.renderer.off("resize", this.bindResize);
    }

    public destroy() {
        this.unActivateSession();
        this.viewport.destroy({ children: true });
    }
}