import { Viewport } from "pixi-viewport";
import { Application, Container } from "pixi.js";

import * as WorkspaceActions from "@/application/actions/workspace.actions";
import { IBaseView } from "@/editor/interface/base-session.interface";
import { TilemapSession } from "@/editor/session/tilemap.session";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { SETTING_KEYS } from "@/application/settings/setting.enum";
import { NORMAL_ZOOM_SCALE } from "@/shared/data-types/view-state.data";
import { TilemapGridRenderer } from "../renderer/tilemap/tilemap-grid.renderer";
import { TilemapRenderer } from "../renderer/tilemap/tilemap.renderer";
import {
    DEFAULT_ZOOM_STEP,
    TILEMAP_MAX_ZOOM_SCALE,
    TILEMAP_MIN_ZOOM_SCALE,
    VIEWPORT_DECELERATION_FRICTION,
    VIEWPORT_INIT_DELAY_MS,
    VIEWPORT_WHEEL_SMOOTHING,
} from "./viewport.defaults";

export class TilemapView implements IBaseView {
    public session: TilemapSession;
    public viewport: Viewport;
    private pixiApp: Application;

    public renderer: TilemapRenderer;
    public overlayerContainer: Container;
    public grid: TilemapGridRenderer;

    private isInit: boolean = false;

    private disposable: (() => void)[] = []

    constructor(session: TilemapSession) {
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
            worldWidth: this.session.tilemap.width * this.session.tilemap.tileWidth,
            worldHeight: this.session.tilemap.height * this.session.tilemap.tileHeight,
            passiveWheel: false,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
        });

        window.addEventListener('pointerdown', this.handleNativePointerState);
        window.addEventListener('pointermove', this.handleNativePointerState);
        window.addEventListener('pointerup', this.handleNativePointerState);
        window.addEventListener('wheel', this.handleNativePointerState, { passive: true });

        this.viewport
            .drag({ mouseButtons: "middle" })
            .wheel({ smooth: VIEWPORT_WHEEL_SMOOTHING })
            .decelerate({ friction: VIEWPORT_DECELERATION_FRICTION })
            .clampZoom({ minScale: TILEMAP_MIN_ZOOM_SCALE, maxScale: TILEMAP_MAX_ZOOM_SCALE });

        setTimeout(() => this.updateViewport(), VIEWPORT_INIT_DELAY_MS);

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
            WorkspaceActions.saveCurrentWorkspace();
        });

        this.viewport.on("zoomed-end", () => {
            this.session.updateViewState({
                zoom: this.viewport.scaled
            });
            WorkspaceActions.saveCurrentWorkspace();
        });

        this.viewport.on("drag-start", () => {
            this.viewport.cursor = "grabbing";
        });

        this.viewport.on("drag-end", () => {
            this.viewport.cursor = "default";
        });

        const settings = appKernel.settings
        const showGrid = settings.get(SETTING_KEYS.View.ShowGrid)

        // Initialize Renderer
        this.grid = new TilemapGridRenderer({ viewport: this.viewport, tilemap: this.session.tilemap, gridEnabled: showGrid });
        this.renderer = new TilemapRenderer({ tilemap: this.session.tilemap, viewport: this.viewport });
        this.overlayerContainer = new Container();

        // Add Renderer
        this.viewport.addChild(this.renderer.container);
        this.viewport.addChild(this.overlayerContainer);
        this.viewport.addChild(this.grid.graphics);

        const onShowGridChanged = settings.onDidChangeSetting(SETTING_KEYS.View.ShowGrid, (event) => {
            const value = event.newValue;
            if (value) {
                this.grid.enableGrid();
            } else {
                this.grid.disableGrid();
            }
        })
        this.disposable.push(onShowGridChanged)
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

        this.pixiApp.stage.addChild(this.viewport);
        this.updateViewport();
    }

    public unActivateView() {
        if (!this.isInit) return;
        this.viewport.removeFromParent();
        this.viewport.eventMode = 'none';
        this.viewport.plugins.pause('drag');
        this.viewport.plugins.pause('wheel');
        this.viewport.plugins.pause('decelerate');
    }

    public destroy() {
        if (!this.isInit) return;
        this.unActivateView();

        window.removeEventListener('pointerdown', this.handleNativePointerState);
        window.removeEventListener('pointermove', this.handleNativePointerState);
        window.removeEventListener('pointerup', this.handleNativePointerState);
        window.removeEventListener('wheel', this.handleNativePointerState);

        this.disposable.forEach(d => d());

        if (this.renderer) this.renderer.destroy();

        this.viewport.destroy({ children: true });
    }

    public zoomIn(delta = DEFAULT_ZOOM_STEP): void {
        if (!this.viewport) return;
        this.setZoom(this.viewport.scaled + delta);
    }

    public zoomOut(delta = DEFAULT_ZOOM_STEP): void {
        if (!this.viewport) return;
        this.setZoom(this.viewport.scaled - delta);
    }

    public normalSize(): void {
        this.setZoom(NORMAL_ZOOM_SCALE);
    }

    public fitMapInView(): void {
        if (!this.viewport) return;

        const mapPixelWidth = this.session.tilemap.width * this.session.tilemap.tileWidth;
        const mapPixelHeight = this.session.tilemap.height * this.session.tilemap.tileHeight;
        const viewportWidth = this.viewport.screenWidth;
        const viewportHeight = this.viewport.screenHeight;

        if (mapPixelWidth <= 0 || mapPixelHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) return;

        const scale = Math.min(viewportWidth / mapPixelWidth, viewportHeight / mapPixelHeight);
        if (!Number.isFinite(scale) || scale <= 0) return;

        this.viewport.scale.set(scale);
        this.viewport.moveCenter(mapPixelWidth / 2, mapPixelHeight / 2);
        this.viewport.emit("zoomed", { viewport: this.viewport, type: "animate" });
        this.viewport.emit("moved", { viewport: this.viewport, type: "animate" });
        this.persistViewState();
    }

    private setZoom(zoom: number): void {
        if (!this.viewport || !Number.isFinite(zoom)) return;

        this.viewport.setZoom(zoom, true);
        this.viewport.emit("zoomed", { viewport: this.viewport, type: "animate" });
        this.persistViewState();
    }

    private persistViewState(): void {
        this.session.updateViewState({
            x: this.viewport.center.x,
            y: this.viewport.center.y,
            zoom: this.viewport.scaled
        });
        WorkspaceActions.saveCurrentWorkspace();
    }

    public updateViewport() {
        if (this.session.viewState.x != null && this.session.viewState.y != null) {
            this.viewport.moveCenter(this.session.viewState.x, this.session.viewState.y);
        }
        this.viewport.setZoom(this.session.viewState.zoom);
    }
}