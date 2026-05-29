import { Container, FederatedPointerEvent, Point } from "pixi.js";

import { Tile, Tileset } from "@/editor/model/tileset/tileset";
import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";
import { ImageCollectionTileset } from "@/editor/model/tileset/image-collection-tileset";
import { CollectionTileLayout } from "@/graphics/renderer/tileset/collection-tileset-grid.renderer";

export type PointLike = {
    x: number;
    y: number;
};

export type TileLayout = {
    tile: Tile;
    index: number;

    /**
     * Position of the actual displayed tile image in the viewport's local space.
     * For single-image tilesets, this is equal to the tile grid cell position.
     * For image-collection tilesets, this is the centered image position inside the cell.
     */
    x: number;
    y: number;

    /**
     * Displayed tile image size in the viewport's local space.
     */
    width: number;
    height: number;

    /**
     * Source/native tile size in tile-local pixels.
     */
    sourceWidth: number;
    sourceHeight: number;

    /**
     * Scale from tile-local pixels to viewport-local pixels.
     */
    scaleX: number;
    scaleY: number;

    /**
     * Grid/cell hit area in viewport-local space.
     * For single-image tilesets, this equals x/y/width/height.
     * For image-collection tilesets, this is the collection grid cell.
     */
    cellX: number;
    cellY: number;
    cellWidth: number;
    cellHeight: number;
};

export type TileLayoutResolverContext = {
    tileset: Tileset;
    parent: Container;

    /**
     * Required only for image-collection tilesets.
     * Usually: () => collectionGridRenderer.getLayouts()
     */
    getCollectionLayouts?: () => CollectionTileLayout[];
};

export abstract class TileLayoutResolver {
    protected readonly tileset: Tileset;
    protected readonly parent: Container;

    protected constructor(context: TileLayoutResolverContext) {
        this.tileset = context.tileset;
        this.parent = context.parent;
    }

    public abstract resolve(tile: Tile): TileLayout | null;

    public resolveByTileId(tileId: number): TileLayout | null {
        const tile = this.tileset.getTileFromId(tileId);
        if (!tile) return null;

        return this.resolve(tile);
    }

    public resolveAll(): TileLayout[] {
        return this.tileset.tiles
            .map((tile) => this.resolve(tile))
            .filter((layout): layout is TileLayout => layout != null);
    }

    public resolveAtGlobalPosition(eventOrPoint: FederatedPointerEvent | PointLike): TileLayout | null {
        const local = this.globalToParentLocal(eventOrPoint);

        return (
            this.resolveAll().find((layout) => {
                return (
                    local.x >= layout.cellX &&
                    local.y >= layout.cellY &&
                    local.x <= layout.cellX + layout.cellWidth &&
                    local.y <= layout.cellY + layout.cellHeight
                );
            }) ?? null
        );
    }

    public globalToParentLocal(eventOrPoint: FederatedPointerEvent | PointLike): PointLike {
        const global = this.toGlobalPoint(eventOrPoint);
        const local = this.parent.toLocal(new Point(global.x, global.y));

        return {
            x: local.x,
            y: local.y,
        };
    }

    public globalToTileLocal(tile: Tile, eventOrPoint: FederatedPointerEvent | PointLike): PointLike | null {
        const layout = this.resolve(tile);
        if (!layout) return null;

        const parentLocal = this.globalToParentLocal(eventOrPoint);

        return this.parentLocalToTileLocal(layout, parentLocal);
    }

    public parentLocalToTileLocal(layout: TileLayout, point: PointLike): PointLike {
        return {
            x: (point.x - layout.x) / layout.scaleX,
            y: (point.y - layout.y) / layout.scaleY,
        };
    }

    public tileLocalToParentLocal(tile: Tile, point: PointLike): PointLike | null {
        const layout = this.resolve(tile);
        if (!layout) return null;

        return {
            x: layout.x + point.x * layout.scaleX,
            y: layout.y + point.y * layout.scaleY,
        };
    }

    public isTileLocalPointInside(tile: Tile, point: PointLike): boolean {
        const layout = this.resolve(tile);
        if (!layout) return false;

        return (
            point.x >= 0 &&
            point.y >= 0 &&
            point.x <= layout.sourceWidth &&
            point.y <= layout.sourceHeight
        );
    }

    public clampTileLocalPoint(tile: Tile, point: PointLike): PointLike {
        const layout = this.resolve(tile);

        if (!layout) {
            return { ...point };
        }

        return {
            x: Math.max(0, Math.min(layout.sourceWidth, point.x)),
            y: Math.max(0, Math.min(layout.sourceHeight, point.y)),
        };
    }

    protected getTileNaturalSize(tile: Tile): { width: number; height: number } {
        return {
            width: Math.max(1, tile.imageSource?.width ?? this.tileset.tilewidth ?? 1),
            height: Math.max(1, tile.imageSource?.height ?? this.tileset.tileheight ?? 1),
        };
    }

    private toGlobalPoint(eventOrPoint: FederatedPointerEvent | PointLike): PointLike {
        const event = eventOrPoint as FederatedPointerEvent;

        if (typeof event.globalX === "number" && typeof event.globalY === "number") {
            return {
                x: event.globalX,
                y: event.globalY,
            };
        }

        return {
            x: eventOrPoint.x,
            y: eventOrPoint.y,
        };
    }

    public static create(context: TileLayoutResolverContext): TileLayoutResolver {
        if (context.tileset instanceof ImageCollectionTileset) {
            if (!context.getCollectionLayouts) {
                throw new Error("ImageCollectionTileset requires getCollectionLayouts.");
            }

            return new CollectionTileLayoutResolver(context);
        }

        if (context.tileset instanceof SingleImageTileset) {
            return new SingleImageTileLayoutResolver(context);
        }

        /**
         * Fallback to single-image resolver because the base Tileset still has
         * tilewidth/tileheight/columns/rows.
         */
        return new SingleImageTileLayoutResolver(context);
    }
}

export class SingleImageTileLayoutResolver extends TileLayoutResolver {
    public constructor(context: TileLayoutResolverContext) {
        super(context);
    }

    public resolve(tile: Tile): TileLayout | null {
        const coordinates = this.tileset.getCoordinatesFromTile(tile.id);
        if (!coordinates) return null;

        const index = this.tileset.tiles.findIndex((candidate) => candidate.id === tile.id);
        if (index < 0) return null;

        const sourceWidth = Math.max(1, this.tileset.tilewidth);
        const sourceHeight = Math.max(1, this.tileset.tileheight);

        const x = coordinates.col * sourceWidth;
        const y = coordinates.row * sourceHeight;

        return {
            tile,
            index,

            x,
            y,

            width: sourceWidth,
            height: sourceHeight,

            sourceWidth,
            sourceHeight,

            scaleX: 1,
            scaleY: 1,

            cellX: x,
            cellY: y,
            cellWidth: sourceWidth,
            cellHeight: sourceHeight,
        };
    }
}

export class CollectionTileLayoutResolver extends TileLayoutResolver {
    private readonly getCollectionLayouts: () => CollectionTileLayout[];

    public constructor(context: TileLayoutResolverContext) {
        super(context);

        if (!context.getCollectionLayouts) {
            throw new Error("CollectionTileLayoutResolver requires getCollectionLayouts.");
        }

        this.getCollectionLayouts = context.getCollectionLayouts;
    }

    public resolve(tile: Tile): TileLayout | null {
        const collectionLayout = this.getCollectionLayouts()
            .find((layout) => layout.tile.id === tile.id);

        if (!collectionLayout) return null;

        const index = collectionLayout.index;
        const naturalSize = this.getTileNaturalSize(tile);

        const sourceWidth = naturalSize.width;
        const sourceHeight = naturalSize.height;

        const width = Math.max(1, collectionLayout.width);
        const height = Math.max(1, collectionLayout.height);

        return {
            tile,
            index,

            x: collectionLayout.x,
            y: collectionLayout.y,

            width,
            height,

            sourceWidth,
            sourceHeight,

            scaleX: width / sourceWidth,
            scaleY: height / sourceHeight,

            cellX: collectionLayout.cellX,
            cellY: collectionLayout.cellY,
            cellWidth: collectionLayout.cellSize,
            cellHeight: collectionLayout.cellSize,
        };
    }

    public override resolveAtGlobalPosition(eventOrPoint: FederatedPointerEvent | PointLike): TileLayout | null {
        const local = this.globalToParentLocal(eventOrPoint);

        const collectionLayout = this.getCollectionLayouts().find((layout) => {
            return (
                local.x >= layout.cellX &&
                local.y >= layout.cellY &&
                local.x <= layout.cellX + layout.cellSize &&
                local.y <= layout.cellY + layout.cellSize
            );
        });

        if (!collectionLayout) return null;

        return this.resolve(collectionLayout.tile);
    }
}