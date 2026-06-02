import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";

import { TilesetSession } from "@/editor/session/tileset.session";
import { WorkspaceService } from "@/shared/services/workspace.service";

import { CollectionTilesetGridRenderer } from "../renderer/tileset/collection-tileset-grid.renderer";
import { CollectionTilesetSelectorRenderer } from "../renderer/tileset/collection-tileset-selector.renderer";
import { CollectionTilesetRenderer } from "../renderer/tileset/collection-tileset.renderer";
import { ITilesetView } from "./tileset.view";

export class CollectionTilesetView implements ITilesetView {
    public session: TilesetSession;
    public viewport: Viewport;

    private pixiApp: Application;
    private renderer: CollectionTilesetRenderer;
    public grid: CollectionTilesetGridRenderer;
    public selector: CollectionTilesetSelectorRenderer;

    private isInit: boolean = false;

    constructor(session: TilesetSession) {
        this.session = session;
    }

    private handleNativePointerState = (event: PointerEvent | WheelEvent) => {
        const target = event.target as HTMLElement;

        const isOverUI =
            target !== this.pixiApp?.canvas &&
            target.tagName !== "HTML" &&
            target.tagName !== "BODY";

        this.pixiApp.stage.eventMode = isOverUI ? "none" : "auto";
    };

    private initView(pixiApp: Application): void {
        this.pixiApp = pixiApp;

        this.viewport = new Viewport({
            screenWidth: pixiApp.screen.width,
            screenHeight: pixiApp.screen.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
        });

        window.addEventListener("pointerdown", this.handleNativePointerState);
        window.addEventListener("pointermove", this.handleNativePointerState);
        window.addEventListener("pointerup", this.handleNativePointerState);
        window.addEventListener("wheel", this.handleNativePointerState, {
            passive: true,
        });

        this.viewport
            .drag({ mouseButtons: "middle" })
            .wheel({ smooth: 15 })
            .decelerate({ friction: 0 })

        this.pixiApp.renderer.on("resize", this.onResize);

        this.viewport.on("moved-end", () => {
            this.session.updateViewState({
                x: this.viewport.center.x,
                y: this.viewport.center.y,
            });

            WorkspaceService.saveCurrentWorkspace();
        });

        this.viewport.on("zoomed-end", () => {
            this.session.updateViewState({
                zoom: this.viewport.scaled,
            });

            WorkspaceService.saveCurrentWorkspace();
        });

        this.viewport.on("drag-start", () => {
            this.viewport.cursor = "grabbing";
        });

        this.viewport.on("drag-end", () => {
            this.viewport.cursor = "default";
        });

        this.grid = new CollectionTilesetGridRenderer({
            viewport: this.viewport,
            tileset: this.session.tileset,
        });

        this.renderer = new CollectionTilesetRenderer({
            tileset: this.session.tileset,
            parent: this.viewport,
            grid: this.grid,
        });

        this.selector = new CollectionTilesetSelectorRenderer({
            tilesetSession: this.session,
            parent: this.viewport,
            grid: this.grid,
        });

        this.viewport.addChild(this.renderer.container);
        this.viewport.addChild(this.grid.graphics);
        this.viewport.addChild(this.selector.graphics);

        setTimeout(() => this.updateViewport(), 0);
    }

    public activateView(pixiApp: Application): void {
        if (this.isInit && this.pixiApp !== pixiApp) {
            this.destroy();
            this.isInit = false;
        }

        if (!this.isInit) {
            this.initView(pixiApp);
            this.isInit = true;
        }

        this.viewport.eventMode = "static";
        this.viewport.plugins.resume("drag");
        this.viewport.plugins.resume("wheel");
        this.viewport.plugins.resume("decelerate");

        this.updateViewport();
        this.pixiApp.stage.addChild(this.viewport);
    }

    public unActivateView(): void {
        if (!this.isInit) return;

        this.viewport.removeFromParent();
        this.viewport.eventMode = "none";

        this.viewport.plugins.pause("drag");
        this.viewport.plugins.pause("wheel");
        this.viewport.plugins.pause("decelerate");
    }

    public updateViewport(): void {
        if (
            this.session.viewState.x != null &&
            this.session.viewState.y != null
        ) {
            this.viewport.moveCenter(
                this.session.viewState.x,
                this.session.viewState.y,
            );
        }

        this.viewport.setZoom(this.session.viewState.zoom);
    }

    private onResize = (): void => {
        const width = this.pixiApp.renderer.width;
        const height = this.pixiApp.renderer.height;

        this.viewport.resize(width, height);

        this.grid.rerenderGrid();
        this.renderer.rerenderTiles();
        this.selector.drawSelection();

        this.updateViewport();
    };

    public get gridEnabled(): boolean {
        return this.grid.gridEnabled;
    }

    public toggleGrid(): void {
        if (this.grid.gridEnabled) {
            this.grid.disableGrid();
        } else {
            this.grid.enableGrid();
        }
    }

    public destroy(): void {
        if (!this.isInit) return;

        this.unActivateView();

        this.pixiApp.renderer.off("resize", this.onResize);

        this.selector.destroy();
        this.selector = null!;

        this.renderer.destroy();
        this.renderer = null!;

        this.grid.destroy();
        this.grid = null!;

        this.viewport.destroy({ children: false });
        this.viewport = null!;

        window.removeEventListener("pointerdown", this.handleNativePointerState);
        window.removeEventListener("pointermove", this.handleNativePointerState);
        window.removeEventListener("pointerup", this.handleNativePointerState);
        window.removeEventListener("wheel", this.handleNativePointerState);

        this.isInit = false;
    }
}

export { CollectionTilesetView as CollectionImageTilesetView };
