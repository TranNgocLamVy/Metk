import { type } from "arktype";
import { RootLayerSchema } from "./layerSchema";
import { safeArray } from ".";

export const TilemapMetadataSchema = type({
    name: type("string").default("Untitled Tilemap"),
    id: type("string"),
    tilemapRelPath: type("string"),
})
export type TilemapMetadata = typeof TilemapMetadataSchema.infer

export const TilesetRefDataSchema = type({
    index: type("number"),
    source: type("string"),
    id: type("string"),
    name: type("string").default("Untitled Tileset"),
})
export type TilesetRefData = typeof TilesetRefDataSchema.infer

export const TilemapDataSchema = type("string.json.parse").to(type({
    id: type("string"),
    name: type("string").default("Untitled Tilemap"),
    height: type("number").default(64),
    width: type("number").default(64),
    tilewidth: type("number").default(16),
    tileheight: type("number").default(16),
    infinite: type("boolean").optional(),
    backgroundcolor: type("string").optional(),
    nextTilesetIndex: type("number").optional(),
    tileset: safeArray(TilesetRefDataSchema).default(() => []),
    layers: RootLayerSchema,
}))
export type TilemapData = typeof TilemapDataSchema.infer;