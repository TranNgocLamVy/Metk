import { type } from "arktype";

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
    name: type("string"),
    columns: type("number"),
    rows: type("number"),
    tilewidth: type("number"),
    tileheight: type("number"),    
    image: type({
        source: type("string"),
        width: type("number"),
        height: type("number"),
    }),
    tiles: tileData.array(),
})
export type TilesetData = typeof TilesetDataSchema.infer;

export const TilesetMetadataSchema = type({
    name: type("string"),
    id: type("string"),
    tilesetRelPath: type("string"),
})
export type TilesetMetadata = typeof TilesetMetadataSchema.infer