import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";

import { TilesetRenderer } from "@/core/application/renderer/tilesetViewRenderer";
import { TilesetSession } from "@/core/application/session/tilesetSession";
import { WorkspaceService } from "@/shared/services/workspaceService";

export class TilesetSessionView {
    public session: TilesetSession;
    public viewport: Viewport;
    private pixiApp: Application;
    private renderer: TilesetRenderer;
    private isInit: boolean = false;

    constructor(session: TilesetSession) {
        this.session = session;
    }

    private initSession(pixiApp: Application) {
        this.pixiApp = pixiApp;

        this.viewport = new Viewport({
            screenWidth: pixiApp.screen.width,
            screenHeight: pixiApp.screen.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
            disableOnContextMenu: true,
        });

        this.viewport
            .drag({ mouseButtons: "left", keyToPress: ["Space"] })
            .wheel({ smooth: 15 })
            .decelerate({ friction: 0 })

        setTimeout(() => this.updateViewport(), 0)

        this.pixiApp.renderer.on("resize", () => {
            const w = this.pixiApp.renderer.width;
            const h = this.pixiApp.renderer.height;
            this.viewport.resize(w, h);

            this.updateViewport();
        });

        this.viewport.on("moved-end", () => {
            this.session.updateViewState({
                x: this.viewport.center.x,
                y: this.viewport.center.y,
            });
            WorkspaceService.saveCurrentWorkspace();
        });

        this.viewport.on("zoomed-end", () => {
            this.session.updateViewState({
                zoom: this.viewport.scaled
            });
            WorkspaceService.saveCurrentWorkspace();
        });

        this.renderer = new TilesetRenderer({ tileset: this.session.tileset, parent: this.viewport });
    }

    public activateSession(pixiApp: Application) {
        if (!this.isInit || this.pixiApp !== pixiApp) {
            this.initSession(pixiApp);
            this.isInit = true;
        }
        
        this.viewport.eventMode = 'static';
        this.viewport.plugins.resume('drag');
        this.viewport.plugins.resume('wheel');
        this.viewport.plugins.resume('decelerate');
        
        this.updateViewport();
        this.pixiApp.stage.addChild(this.viewport);
    }

    public unActivateSession() {
        if (!this.isInit) return;
        this.viewport.removeFromParent();
        this.viewport.eventMode = 'none';
        this.viewport.plugins.pause('drag');
        this.viewport.plugins.pause('wheel');
        this.viewport.plugins.pause('decelerate');
    }

    public destroy() {
        if (!this.isInit) return;
        this.unActivateSession();
        this.viewport.destroy({ children: true });
    }

    public updateViewport() {
        if (this.session.viewState.x != null && this.session.viewState.y != null) {
            this.viewport.moveCenter(this.session.viewState.x, this.session.viewState.y);
        }
        this.viewport.setZoom(this.session.viewState.zoom);
    }
}