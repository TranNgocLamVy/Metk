import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";

import { TilesetSession } from "@/editor/session/tileset.session";
import { IBaseView } from "@/editor/interface/base-session.interface";
import { WorkspaceService } from "@/shared/services/workspace.service";

import { TilesetGridRenderer } from "../renderer/tileset/tileset-grid.renderer";
import { TilesetRenderer } from "../renderer/tileset/tileset.renderer";
import { TilesetSelectorRenderer } from "../renderer/tileset/tileset-selector.renderer";

export class SingleImageTilesetView implements IBaseView {
    public session: TilesetSession;
    public viewport: Viewport;
    private pixiApp: Application;
    private renderer: TilesetRenderer;
    public grid: TilesetGridRenderer;
    public gridEnabled: boolean = true;
    public selector: TilesetSelectorRenderer;
    private isInit: boolean = false;

    constructor(session: TilesetSession) {
        this.session = session;
    }

    private handleNativePointerState = (e: PointerEvent | WheelEvent) => {
        const target = e.target as HTMLElement;
        const isOverUI = target !== this.pixiApp?.canvas && target.tagName !== 'HTML' && target.tagName !== 'BODY';
        this.pixiApp.stage.eventMode = isOverUI ? 'none' : 'auto';
    };

    private initView(pixiApp: Application) {
        this.pixiApp = pixiApp;

        this.viewport = new Viewport({
            screenWidth: pixiApp.screen.width,
            screenHeight: pixiApp.screen.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
        });

        window.addEventListener('pointerdown', this.handleNativePointerState);
        window.addEventListener('pointermove', this.handleNativePointerState);
        window.addEventListener('pointerup', this.handleNativePointerState);
        window.addEventListener('wheel', this.handleNativePointerState, { passive: true });

        this.viewport
            .drag({ mouseButtons: "middle " })
            .wheel({ smooth: 15 })
            .decelerate({ friction: 0 })
            .clampZoom({ minScale: 0.5, maxScale: 50 })

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

        this.viewport.on("drag-start", (e) => {
            this.viewport.cursor = "grabbing";
        });

        this.viewport.on("drag-end", () => {
            this.viewport.cursor = "default";
        });

        this.grid = new TilesetGridRenderer({ viewport: this.viewport, tileset: this.session.tileset });
        this.renderer = new TilesetRenderer({ tileset: this.session.tileset, parent: this.viewport });
        this.selector = new TilesetSelectorRenderer({ tileset: this.session.tileset, tilesetSession: this.session, parent: this.viewport });


        // Selector is on top of renderer (init after renderer)
        this.viewport.addChild(this.renderer.container);
        this.viewport.addChild(this.grid.graphics);
        this.viewport.addChild(this.selector.graphics);
    }

    public activateView(pixiApp: Application) {
        if (this.isInit && this.pixiApp !== pixiApp) {
            this.destroy();
            this.isInit = false;
        }
    
        if (!this.isInit) {
            this.initView(pixiApp);
            this.isInit = true;
        }
        
        this.viewport.eventMode = 'static';
        this.viewport.plugins.resume('drag');
        this.viewport.plugins.resume('wheel');
        this.viewport.plugins.resume('decelerate');
        
        this.updateViewport();
        this.pixiApp.stage.addChild(this.viewport);
    }

    public unActivateView() {
        if (!this.isInit) return;
        this.viewport.removeFromParent();
        this.viewport.eventMode = 'none';
        this.viewport.plugins.pause('drag');
        this.viewport.plugins.pause('wheel');
        this.viewport.plugins.pause('decelerate');
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
        } else {
            this.grid.enableGrid();
        }
    }

    public destroy() {
        if (!this.isInit) return;
        this.unActivateView();
        this.viewport.destroy({ children: true });
        this.viewport = null!;

        this.renderer.destroy();
        this.renderer = null!;

        this.selector.destroy();
        this.selector = null!;

        window.removeEventListener('pointerdown', this.handleNativePointerState);
        window.removeEventListener('pointermove', this.handleNativePointerState);
        window.removeEventListener('pointerup', this.handleNativePointerState);
        window.removeEventListener('wheel', this.handleNativePointerState);
    }
}