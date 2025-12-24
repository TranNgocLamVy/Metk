// src-ui/view/models/tilemapSessionView.ts
import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";

import { TilemapSession } from "@/core/application/session/tilemapSession";
import { WorkspaceService } from "@/shared/services/workspaceService";

import { TilemapRenderer } from "./tilemapEditorRenderer";

export class TilemapSessionView {
    public session: TilemapSession;
    public viewport: Viewport;
    private pixiApp: Application;
    private renderer: TilemapRenderer;
    private isInit: boolean = false;

    constructor(session: TilemapSession) {
        this.session = session;
    }

    private initSession(pixiApp: Application) {
        this.pixiApp = pixiApp;

        this.viewport = new Viewport({
            screenWidth: pixiApp.screen.width,
            screenHeight: pixiApp.screen.height,
            worldWidth: this.session.tilemap.width * this.session.tilemap.tilewidth,
            worldHeight: this.session.tilemap.height * this.session.tilemap.tileheight,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
            disableOnContextMenu: true,
        });
        // this.viewport.isRenderGroup = true;

        this.viewport
            .drag({ mouseButtons: "middle" }) // Kéo bằng chuột giữa
            .wheel({ smooth: 15 })
            .decelerate({ friction: 0 })
            .clampZoom({ minScale: 0.1, maxScale: 5 })

        setTimeout(() => this.updateViewport(), 0);

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

        this.viewport.on("drag-start", () => {
            this.viewport.cursor = "grabbing";
        });

        this.viewport.on("drag-end", () => {
            this.viewport.cursor = "default";
        });

        this.renderer = new TilemapRenderer({ 
            tilemap: this.session.tilemap, 
            parent: this.viewport 
        });
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
        this.renderer.destroy();
        this.viewport.destroy({ children: true });
    }

    public updateViewport() {
        if (this.session.viewState.x != null && this.session.viewState.y != null) {
            this.viewport.moveCenter(this.session.viewState.x, this.session.viewState.y);
        }
        this.viewport.setZoom(this.session.viewState.zoom);
    }

    public toggleGrid() {
        this.renderer?.toggleGrid();
    }
}