import { CollisionObjectData } from "./collision-object.data";
import { ImageSourceData } from "./image-source.data";

export const DEFAULT_TILESET_COLUMNS = 16;
export const DEFAULT_TILESET_ROWS = 16;
export const DEFAULT_TILESET_TILE_WIDTH = 16;
export const DEFAULT_TILESET_TILE_HEIGHT = 16;

export const TilesetType = {
    SingleImage: "single-image",
    ImageCollection: "image-collection",
} as const;

export const TilesetTypeValues = [
    TilesetType.SingleImage,
    TilesetType.ImageCollection,
] as const;

export type TilesetType = typeof TilesetType[keyof typeof TilesetType];

export type TileData = {
    id: number;
    cloneFrom?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    image?: ImageSourceData;
    collisionObjects?: CollisionObjectData[];
};

export type TilesetData = {
    id: string;
    name: string;
    type?: TilesetType;
    columns: number;
    rows: number;
    tileWidth: number;
    tileHeight: number;
    image?: ImageSourceData;
    tiles: TileData[];
};

export type TilesetMetadata = {
    name: string;
    id: string;
    tilesetRelPath: string;
};

export type TilesetRefData = {
    id: string;
    index: number;
    name: string;
};
