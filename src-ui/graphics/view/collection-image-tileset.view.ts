import { Viewport } from "pixi-viewport";
import { Application, Container, FederatedMouseEvent, FederatedPointerEvent, Graphics, Point, Sprite, Texture } from "pixi.js";

import { TilesetSession } from "@/editor/session/tileset.session";
import { IBaseView } from "@/editor/interface/base-session.interface";
import { Tile } from "@/editor/model/tileset/tileset";
import { WorkspaceService } from "@/shared/services/workspace.service";
import { appKernel } from "@/application/bootstrap/app-kernel";

type CollectionTileLayout = {
    tile: Tile;
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

export class CollectionImageTilesetView implements IBaseView {
    public session: TilesetSession;
    public viewport: Viewport;

    private pixiApp: Application;

    private tileContainer: Container;
    private selectionGraphics: Graphics;

    private sprites: Sprite[] = [];
    private layouts: CollectionTileLayout[] = [];

    private isInit: boolean = false;

    private selectedTileIds: Set<number> = new Set();

    private bindOnTextureReloaded: (tilesetId: string) => void;
    private bindOnPointerDown: (event: FederatedPointerEvent) => void;

    constructor(session: TilesetSession) {
        this.session = session;

        this.bindOnTextureReloaded = this.onTextureReloaded.bind(this);
        this.bindOnPointerDown = this.onPointerDown.bind(this);
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

        this.viewport
            .drag({ mouseButtons: "middle " })
            .wheel({ smooth: 15 })
            .decelerate({ friction: 0 })
            .clampZoom({ minScale: 0.5, maxScale: 50 });

        this.tileContainer = new Container();
        this.selectionGraphics = new Graphics();

        this.viewport.addChild(this.tileContainer);
        this.viewport.addChild(this.selectionGraphics);

        this.viewport.eventMode = "static";
        this.viewport.on("pointerdown", this.bindOnPointerDown);

        this.selectedTileIds = new Set(
            this.session.selectionState?.selectedTilesSet ?? [],
        );

        window.addEventListener("pointerdown", this.handleNativePointerState);
        window.addEventListener("pointermove", this.handleNativePointerState);
        window.addEventListener("pointerup", this.handleNativePointerState);
        window.addEventListener("wheel", this.handleNativePointerState, {
            passive: true,
        });

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

        appKernel.textureManager.on(
            "onTextureReloaded",
            this.bindOnTextureReloaded,
        );

        this.renderTiles();
        this.drawSelection();

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

        this.renderTiles();
        this.drawSelection();
        this.updateViewport();
    };

    private async renderTiles(): Promise<void> {
        const textureManager = appKernel.editorFacade.textureManager;

        this.sprites.forEach((sprite) => sprite.destroy());
        this.sprites = [];
        this.tileContainer.removeChildren();

        this.layouts = this.calculateLayouts();

        let errorTexture: Texture | null = null;

        for (const layout of this.layouts) {
            let texture = textureManager.getTileTexture(
                this.session.tileset.id,
                layout.tile.id,
            );

            if (!texture) {
                if (!errorTexture) {
                    errorTexture = await textureManager.getErrorTexture();
                }

                texture = errorTexture;
            }

            const sprite = new Sprite(texture);

            sprite.position.set(layout.x, layout.y);
            sprite.width = layout.width;
            sprite.height = layout.height;

            this.sprites.push(sprite);
            this.tileContainer.addChild(sprite);
        }

        this.drawSelection();
    }

    private calculateLayouts(): CollectionTileLayout[] {
        const tileset = this.session.tileset;
        const wrapWidth = this.getWrapWidth();

        const layouts: CollectionTileLayout[] = [];

        let x = 0;
        let y = 0;
        let rowHeight = 0;

        tileset.tiles.forEach((tile, index) => {
            const width = Math.max(
                1,
                tile.image?.width ?? tileset.tilewidth ?? 1,
            );

            const height = Math.max(
                1,
                tile.image?.height ?? tileset.tileheight ?? 1,
            );

            if (x > 0 && x + width > wrapWidth) {
                x = 0;
                y += rowHeight;
                rowHeight = 0;
            }

            layouts.push({
                tile,
                index,
                x,
                y,
                width,
                height,
            });

            x += width;
            rowHeight = Math.max(rowHeight, height);
        });

        return layouts;
    }

    private getWrapWidth(): number {
        return Math.max(1, this.pixiApp?.renderer.width ?? 1);
    }

    private onPointerDown(event: FederatedPointerEvent): void {
        const world = new Point(event.globalX, event.globalY);
        const local = this.viewport.toLocal(world);

        const layout = this.getLayoutAtPosition({
            x: local.x,
            y: local.y,
        });

        if (!layout) {
            this.clearSelection();
            return;
        }

        const original = event.originalEvent as FederatedMouseEvent;
        const isCtrl = !!(original.ctrlKey || original.metaKey);

        if (!isCtrl) {
            this.selectedTileIds.clear();
        }

        if (isCtrl && this.selectedTileIds.has(layout.tile.id)) {
            this.selectedTileIds.delete(layout.tile.id);
        } else {
            this.selectedTileIds.add(layout.tile.id);
        }

        this.saveSelection(layout);
        this.drawSelection();
    }

    private getLayoutAtPosition(position: Position): CollectionTileLayout | null {
        return (
            this.layouts.find((layout) => {
                return (
                    position.x >= layout.x &&
                    position.y >= layout.y &&
                    position.x <= layout.x + layout.width &&
                    position.y <= layout.y + layout.height
                );
            }) ?? null
        );
    }

    private saveSelection(lastLayout: CollectionTileLayout): void {
        const selectedTilesSet = Array.from(this.selectedTileIds);

        const pivot = {
            row: 0,
            col: lastLayout.index,
        };

        this.session.updateSelectionState({
            selectedTilesSet,
        });

        WorkspaceService.saveCurrentWorkspace({
            waitForTimeout: false,
        });
    }

    private clearSelection(): void {
        this.selectedTileIds.clear();

        this.session.updateSelectionState({
            selectedTilesSet: [],
        });

        this.selectionGraphics.clear();

        WorkspaceService.saveCurrentWorkspace({
            waitForTimeout: false,
        });
    }

    private drawSelection(): void {
        this.selectionGraphics.clear();

        if (this.selectedTileIds.size === 0) return;

        this.selectionGraphics.fill({
            color: 0x0090f1,
            alpha: 0.4,
        });

        for (const layout of this.layouts) {
            if (!this.selectedTileIds.has(layout.tile.id)) continue;

            this.selectionGraphics.rect(
                layout.x,
                layout.y,
                layout.width,
                layout.height,
            );
        }

        this.selectionGraphics.fill();
    }

    private onTextureReloaded(tilesetId: string): void {
        if (tilesetId !== this.session.tileset.id) return;

        this.renderTiles();
    }

    public destroy(): void {
        if (!this.isInit) return;

        this.unActivateView();

        appKernel.textureManager.off(
            "onTextureReloaded",
            this.bindOnTextureReloaded,
        );

        this.pixiApp.renderer.off("resize", this.onResize);

        this.viewport.off("pointerdown", this.bindOnPointerDown);

        this.sprites.forEach((sprite) => sprite.destroy());
        this.sprites = [];

        this.tileContainer.destroy({ children: true });
        this.selectionGraphics.destroy();

        this.viewport.destroy({ children: true });
        this.viewport = null!;

        window.removeEventListener("pointerdown", this.handleNativePointerState);
        window.removeEventListener("pointermove", this.handleNativePointerState);
        window.removeEventListener("pointerup", this.handleNativePointerState);
        window.removeEventListener("wheel", this.handleNativePointerState);

        this.isInit = false;
    }
}