import { Viewport } from "pixi-viewport";
import { Application, Container, FederatedPointerEvent, Graphics, Sprite, Texture } from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { ImageCollectionTileset } from "@/editor/model/tileset/image-collection-tileset";
import { Tile, Tileset } from "@/editor/model/tileset/tileset";
import { CollisionEditorLayerRenderer } from "@/graphics/renderer/collision/collision-editor-layer.renderer";
import { CollisionEditorController } from "@/graphics/renderer/collision/collision-editor.controller";
import { PointLike, TileLayout, TileLayoutResolver, TileLayoutResolverContext } from "@/graphics/renderer/collision/tile-layout-resolver";

type SelectedTileRendererOptions = {
    pixiApp: Application;
    tileset: Tileset;
    onCommit?: () => void;
};

export class SelectedTilePixiRenderer {
    private disposed = false;
    private retained = false;

    private viewport: Viewport | null = null;
    private tileContainer: Container | null = null;
    private tileBoundsGraphics: Graphics | null = null;
    private layoutResolver: SelectedTileLayoutResolver | null = null;
    private collisionController: CollisionEditorController | null = null;
    private collisionLayer: CollisionEditorLayerRenderer | null = null;
    private currentSprite: Sprite | null = null;
    private selectedTile: Tile | null = null;
    private selectedCollisionObjectId: string | null = null;

    private cleanupPointerEvents: (() => void) | null = null;

    public constructor(private readonly options: SelectedTileRendererOptions) { }

    public async init(): Promise<void> {
        const retainResult =
            await appKernel.editorFacade.textureManager.retainTilesetGraphics(
                this.options.tileset,
            );

        this.retained = retainResult.status === "Success";

        if (this.disposed) {
            this.releaseTextures();
            return;
        }

        this.createRuntime();
        appKernel.editorFacade.textureManager.on(
            "onTextureReloaded",
            this.handleTextureReloaded,
        );

        await this.renderSelectedTile(this.selectedTile);
    }

    public async renderSelectedTile(tile: Tile | null): Promise<void> {
        this.selectedTile = tile;

        if (this.disposed || !this.viewport || !this.collisionController) return;

        await this.renderSelectedTileSprite(tile);

        if (this.disposed || !this.collisionController || !this.collisionLayer) {
            return;
        }

        this.collisionController.selectTile(tile);
        this.syncSelectedCollisionObject();
        this.collisionLayer.render();
        this.drawSelectedTileBounds();
        this.fitViewportToSelectedTile();
    }

    public selectCollisionObject(objectId: string | null): void {
        this.selectedCollisionObjectId = objectId;
        this.syncSelectedCollisionObject();
        this.collisionLayer?.render();
        this.drawSelectedTileBounds();
    }

    public resize(width: number, height: number): void {
        if (this.disposed) return;

        this.options.pixiApp.renderer.resize(width, height);
        this.viewport?.resize(width, height);
        this.fitViewportToSelectedTile();
    }

    public destroy(): void {
        if (this.disposed) return;

        this.disposed = true;

        this.cleanupPointerEvents?.();
        this.cleanupPointerEvents = null;

        appKernel.editorFacade.textureManager.off(
            "onTextureReloaded",
            this.handleTextureReloaded,
        );

        this.collisionLayer?.destroy();
        this.collisionLayer = null;

        this.currentSprite?.destroy();
        this.currentSprite = null;

        this.tileBoundsGraphics?.destroy();
        this.tileBoundsGraphics = null;

        this.tileContainer?.destroy({ children: true });
        this.tileContainer = null;

        this.viewport?.removeFromParent();
        this.viewport?.destroy({ children: false });
        this.viewport = null;

        this.releaseTextures();
    }

    private createRuntime(): void {
        const { pixiApp, tileset, onCommit } = this.options;

        const viewport = new Viewport({
            screenWidth: pixiApp.renderer.width,
            screenHeight: pixiApp.renderer.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: pixiApp.renderer.events,
        });

        viewport.eventMode = "static";

        viewport
            .drag({ mouseButtons: "middle" })
            .wheel({ smooth: 15 })
            .decelerate({ friction: 0 })
            .clampZoom({ minScale: 0.25, maxScale: 64 });

        pixiApp.renderer.on("resize", () => {
            const w = pixiApp.renderer.width;
            const h = pixiApp.renderer.height;
            viewport.resize(w, h);
            viewport.emit("resize")
        });

        const tileContainer = new Container();
        tileContainer.label = "EditTilesetSelectedTileLayer";

        const tileBoundsGraphics = new Graphics();
        tileBoundsGraphics.label = "EditTilesetSelectedTileBounds";

        const layoutResolver = new SelectedTileLayoutResolver({
            tileset,
            parent: viewport,
            getSelectedTile: () => this.selectedTile,
        });

        let collisionLayer: CollisionEditorLayerRenderer | null = null;

        const collisionController = new CollisionEditorController({
            tileset,
            layoutResolver,
            onChange: () => {
                collisionLayer?.render();
                this.drawSelectedTileBounds();
            },
            onSelectionChange: () => {
                collisionLayer?.render();
                this.drawSelectedTileBounds();
            },
            onCommit: () => {
                onCommit?.();
            },
        });

        collisionLayer = new CollisionEditorLayerRenderer({
            tileset,
            layoutResolver,
            editorController: collisionController,
            parent: viewport,
            mode: "selected-tile",
            bindDragEvents: false,
            getSelectedObjectId: () => this.selectedCollisionObjectId,
        });

        viewport.addChild(tileContainer);
        viewport.addChild(collisionLayer.container);
        viewport.addChild(tileBoundsGraphics);

        this.viewport = viewport;
        this.tileContainer = tileContainer;
        this.tileBoundsGraphics = tileBoundsGraphics;
        this.layoutResolver = layoutResolver;
        this.collisionController = collisionController;
        this.collisionLayer = collisionLayer;

        this.bindPointerEvents();
        pixiApp.stage.addChild(viewport);
    }

    private bindPointerEvents(): void {
        const viewport = this.viewport;
        const collisionController = this.collisionController;

        if (!viewport || !collisionController) return;

        const onPointerMove = (event: FederatedPointerEvent) => {
            collisionController.updateDrag(event);
        };

        const onPointerUp = () => {
            collisionController.endDrag();
        };

        const onViewportZoom = () => {
            this.collisionLayer?.render();
        };

        viewport.on("pointermove", onPointerMove);
        viewport.on("pointerup", onPointerUp);
        viewport.on("pointerupoutside", onPointerUp);
        viewport.on("zoomed", onViewportZoom);

        this.cleanupPointerEvents = () => {
            viewport.off("pointermove", onPointerMove);
            viewport.off("pointerup", onPointerUp);
            viewport.off("pointerupoutside", onPointerUp);
            viewport.off("zoomed", onViewportZoom);
        };
    }

    private async renderSelectedTileSprite(tile: Tile | null): Promise<void> {
        this.tileContainer?.removeChildren();

        this.currentSprite?.destroy();
        this.currentSprite = null;

        if (!tile) {
            this.tileBoundsGraphics?.clear();
            this.collisionLayer?.render();
            return;
        }

        let texture: Texture | null =
            appKernel.editorFacade.textureManager.getTileTexture(
                this.options.tileset.id,
                tile.id,
            );

        if (!texture) {
            texture = await appKernel.editorFacade.textureManager.getErrorTexture();
        }

        if (this.disposed || !this.tileContainer) return;

        const sourceSize = getTileSourceSize(this.options.tileset, tile);
        const sprite = new Sprite(texture);

        sprite.position.set(0, 0);
        sprite.width = sourceSize.width;
        sprite.height = sourceSize.height;
        sprite.zIndex = 0;

        this.currentSprite = sprite;
        this.tileContainer.addChild(sprite);
    }

    private drawSelectedTileBounds(): void {
        if (
            this.disposed ||
            !this.tileBoundsGraphics ||
            !this.collisionController ||
            !this.layoutResolver
        ) {
            return;
        }

        this.tileBoundsGraphics.clear();

        const tile = this.collisionController.getSelectedTile();
        if (!tile) return;

        const layout = this.layoutResolver.resolve(tile);
        if (!layout) return;

        this.tileBoundsGraphics
            .rect(layout.cellX, layout.cellY, layout.cellWidth, layout.cellHeight)
            .stroke({
                color: 0xffcc00,
                width: 1,
                pixelLine: true,
            });
    }

    private syncSelectedCollisionObject(): void {
        if (!this.collisionController) return;

        const objectId = this.selectedCollisionObjectId;

        if (
            objectId &&
            this.selectedTile?.collisionObjects.some(
                (object) => object.id === objectId,
            )
        ) {
            this.collisionController.selectObject(objectId);
            return;
        }

        this.collisionController.selectObject(null);
    }

    private fitViewportToSelectedTile(): void {
        if (
            this.disposed ||
            !this.viewport ||
            !this.collisionController ||
            !this.layoutResolver
        ) {
            return;
        }

        const tile = this.collisionController.getSelectedTile();
        if (!tile) return;

        const layout = this.layoutResolver.resolve(tile);
        if (!layout) return;

        const screenWidth = this.options.pixiApp.renderer.width;
        const screenHeight = this.options.pixiApp.renderer.height;

        if (screenWidth <= 0 || screenHeight <= 0) return;

        const padding = 64;
        const availableWidth = Math.max(1, screenWidth - padding * 2);
        const availableHeight = Math.max(1, screenHeight - padding * 2);

        const scale = Math.min(
            availableWidth / layout.width,
            availableHeight / layout.height,
        );

        const clampedScale = Math.max(0.25, Math.min(32, scale));

        this.viewport.setZoom(clampedScale, true);
        this.viewport.moveCenter(
            layout.x + layout.width / 2,
            layout.y + layout.height / 2,
        );
    }

    private releaseTextures(): void {
        if (!this.retained) return;

        appKernel.editorFacade.textureManager.releaseTilesetGraphics(
            this.options.tileset.id,
        );
        this.retained = false;
    }

    private readonly handleTextureReloaded = (tilesetId: string) => {
        if (tilesetId !== this.options.tileset.id) return;
        void this.renderSelectedTile(this.selectedTile);
    };
}

class SelectedTileLayoutResolver extends TileLayoutResolver {
    private readonly getSelectedTile: () => Tile | null;

    public constructor(
        context: TileLayoutResolverContext & {
            getSelectedTile: () => Tile | null;
        },
    ) {
        super(context);
        this.getSelectedTile = context.getSelectedTile;
    }

    public resolve(tile: Tile): TileLayout | null {
        const selectedTile = this.getSelectedTile();

        if (!selectedTile) return null;
        if (selectedTile.id !== tile.id) return null;

        const sourceSize = getTileSourceSize(this.tileset, tile);

        const index = this.tileset.tiles.findIndex(
            (candidate) => candidate.id === tile.id,
        );

        if (index < 0) return null;

        return {
            tile,
            index,

            x: 0,
            y: 0,

            width: sourceSize.width,
            height: sourceSize.height,

            sourceWidth: sourceSize.width,
            sourceHeight: sourceSize.height,

            scaleX: 1,
            scaleY: 1,

            cellX: 0,
            cellY: 0,
            cellWidth: sourceSize.width,
            cellHeight: sourceSize.height,
        };
    }

    public override resolveAll(): TileLayout[] {
        const selectedTile = this.getSelectedTile();
        if (!selectedTile) return [];

        const layout = this.resolve(selectedTile);

        return layout ? [layout] : [];
    }

    public override resolveAtGlobalPosition(
        eventOrPoint: FederatedPointerEvent | PointLike,
    ): TileLayout | null {
        const selectedTile = this.getSelectedTile();
        if (!selectedTile) return null;

        const layout = this.resolve(selectedTile);
        if (!layout) return null;

        const local = this.globalToParentLocal(eventOrPoint);

        const isInside =
            local.x >= layout.cellX &&
            local.y >= layout.cellY &&
            local.x <= layout.cellX + layout.cellWidth &&
            local.y <= layout.cellY + layout.cellHeight;

        return isInside ? layout : null;
    }
}

function getTileSourceSize(
    tileset: Tileset,
    tile: Tile,
): {
    width: number;
    height: number;
} {
    if (tileset instanceof ImageCollectionTileset) {
        return {
            width: Math.max(1, tile.imageSource?.width ?? tileset.tileWidth ?? 1),
            height: Math.max(1, tile.imageSource?.height ?? tileset.tileHeight ?? 1),
        };
    }

    return {
        width: Math.max(1, tileset.tileWidth),
        height: Math.max(1, tileset.tileHeight),
    };
}
