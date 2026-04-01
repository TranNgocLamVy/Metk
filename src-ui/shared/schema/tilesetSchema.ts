import { type } from "arktype";
import { safeArray } from ".";

const tileData = type({
    id: type("number"),
    x: type("number").optional(),
    y: type("number").optional(),
    width: type("number").optional(),
    height: type("number").optional(),
})
export type TileData = typeof tileData.infer;

export const TilesetDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string").default("Untitled Tileset"),
    columns: type("number").default(16),
    rows: type("number").default(16),
    tilewidth: type("number").default(16),
    tileheight: type("number").default(16),
    image: type({
        source: type("string"),
        width: type("number"),
        height: type("number"),
    }),
    tiles: safeArray(tileData).default(() => []),
})
export type TilesetData = typeof TilesetDataSchema.infer;

export const TilesetMetadataSchema = type({
    name: type("string").default("Untitled Tileset"),
    id: type("string"),
    tilesetRelPath: type("string"),
})
export type TilesetMetadata = typeof TilesetMetadataSchema.infer