import { type } from "arktype";
import { safeArray } from "./utils";
import { imageSourceSchema } from "./image-source.schema";

export const TilesetType = {
    SingleImage: "single-image",
    ImageCollection: "image-collection",
} as const;

export type TilesetType = typeof TilesetType[keyof typeof TilesetType];

const tileData = type({
    id: type("number"),
    x: type("number").optional(),
    y: type("number").optional(),
    width: type("number").optional(),
    height: type("number").optional(),
    image: imageSourceSchema.optional(),
});
export type TileData = typeof tileData.infer;

export const TilesetDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string").default("Untitled Tileset"),
    type: type("'single-image' | 'image-collection'").optional(),
    columns: type("number").default(16),
    rows: type("number").default(16),
    tilewidth: type("number").default(16),
    tileheight: type("number").default(16),
    image: imageSourceSchema.optional(),
    tiles: safeArray(tileData).default(() => []),
})
export type TilesetData = typeof TilesetDataSchema.infer;

export const TilesetMetadataSchema = type({
    name: type("string").default("Untitled Tileset"),
    id: type("string"),
    tilesetRelPath: type("string"),
})
export type TilesetMetadata = typeof TilesetMetadataSchema.infer

export const TilesetRefDataSchema = type({
    index: type("number"),
    id: type("string"),
    name: type("string").default("Untitled Tileset"),
})
export type TilesetRefData = typeof TilesetRefDataSchema.infer