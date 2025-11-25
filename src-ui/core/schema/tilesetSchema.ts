import { type } from "arktype";

const tilesetMetadataSchema = type({
    version: type("string"),
    encoding: type("string"),
})
export type TilesetMetadata = typeof tilesetMetadataSchema.infer;

const tileData = type({
    id: type("string.numeric.parse"),
    type: type("string").optional(),
    x: type("string.numeric.parse").optional(),
    y: type("string.numeric.parse").optional(),
    width: type("string.numeric.parse").optional(),
    height: type("string.numeric.parse").optional(),
})
export type TileData = typeof tileData.infer;

export const tilesetDataSchema = type({
    name: type("string"),
    tilecount: type("string.numeric.parse"),
    columns: type("string.numeric.parse"),
    tilewidth: type("string.numeric.parse"),
    tileheight: type("string.numeric.parse"),    
    version: type("string").optional(),
    image: type({
        source: type("string"),
        width: type("string.numeric.parse"),
        height: type("string.numeric.parse"),
    }),
    tileOffset: type({
        x: type("string.numeric.parse"),
        y: type("string.numeric.parse"),
    }).optional(),
    grid: type({
        orientation: type("'orthogonal' | 'isometric'"),
        width: type("string.numeric.parse"),
        height: type("string.numeric.parse"),
    }).optional(),
    tile: tileData.array().default(() => []),
})
export type TilesetData = typeof tilesetDataSchema.infer;

export const tilesetSchema = type({
    "?xml": tilesetMetadataSchema,
    "tileset": tilesetDataSchema
})
export type Tileset = typeof tilesetSchema.infer;