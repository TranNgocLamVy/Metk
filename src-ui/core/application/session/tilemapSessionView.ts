import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";

import { TilemapSession } from "@/core/application/session/tilemapSession";
import { WorkspaceService } from "@/shared/services/workspaceService";
import { TilemapEventHub } from "@/view/models/tilemapEventHub";

import { TilemapGridRenderer } from "../renderer/tilemapGridRenderer";
import { TilemapRenderer } from "../renderer/tilemapRenderer";

export class TilemapSessionView {
    public session: TilemapSession;
    public viewport: Viewport;
    private pixiApp: Application;
    
    private renderer: TilemapRenderer;
    public grid: TilemapGridRenderer;
    private eventHub: TilemapEventHub;
    
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
        });

        this.viewport
            .drag({ mouseButtons: "middle" }) // Drag with middle mouse button
            .wheel({ smooth: 15 })
            .decelerate({ friction: 0 })
            .clampZoom({ minScale: 0.05, maxScale: 50 });

        setTimeout(() => this.updateViewport(), 0);

        this.pixiApp.renderer.on("resize", () => {
            const w = this.pixiApp.renderer.width;
            const h = this.pixiApp.renderer.height;
            this.viewport.resize(w, h);
            this.updateViewport();
            this.viewport.emit("resize")
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

        // Initialize Renderer
        this.grid = new TilemapGridRenderer({ viewport: this.viewport, tilemap: this.session.tilemap });
        this.renderer = new TilemapRenderer({ tilemap: this.session.tilemap, gap: this.grid.gridGap });
        
        // Add Renderer
        this.viewport.addChild(this.renderer.container);
        this.viewport.addChild(this.grid.graphics);

        this.eventHub = new TilemapEventHub(this.viewport, this.session.tilemap);
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
        
        this.pixiApp.stage.addChild(this.viewport);
        this.updateViewport();
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
        
        if (this.eventHub) this.eventHub.destroy();
        if (this.renderer) this.renderer.destroy();
        
        this.viewport.destroy({ children: true });
    }

    public updateViewport() {
        if (this.session.viewState.x != null && this.session.viewState.y != null) {
            this.viewport.moveCenter(this.session.viewState.x, this.session.viewState.y);
        }
        this.viewport.setZoom(this.session.viewState.zoom);
    }

    public toggleGrid(): void {
        if (this.grid.gridEnabled) {
            this.grid.disableGrid();
            this.renderer.setGap(0);
        } else {
            this.grid.enableGrid();
            this.renderer.setGap(this.grid.gridGap);
        }
    }
}