import { type } from "arktype";

const TilemapMetadataSchema = type({
    version: type("string"),
    encoding: type("string"),
})
export type TilemapMetadata = typeof TilemapMetadataSchema.infer;

const TileDataSchema = type({
    encoding: type("'csv'"),
    "#text": type("string"),
})

const TilelayerDataSchema = type({
    id: type("string"),
    name: type("string"),
    class: type("string").optional(),
    x: type("string.numeric.parse").optional(),
    y: type("string.numeric.parse").optional(),
    width: type("string.numeric.parse"),
    height: type("string.numeric.parse"),
    opacity: type("string.numeric.parse").default("1"),
    visible: type("string.numeric.parse").default("1"),
    locked: type("string.numeric.parse").default("0"),
    offsetx: type("string.numeric.parse").default("0"),
    offsety: type("string.numeric.parse").default("0"),

    // For hexagonal maps (Unused at the moment)
    parallaxx: type("string.numeric.parse").optional(),
    parallaxy: type("string.numeric.parse").optional(),

    data: TileDataSchema,
})
export type TileLayerData = typeof TilelayerDataSchema.infer;

const externalTilesetDataSchema = type({
    source: type("string"),
})
export type ExternalTileset = typeof externalTilesetDataSchema.infer;

export const TilemapDataSchema = type({
    name: type("string"),
    height: type("string.numeric.parse"),
    width: type("string.numeric.parse"),
    tilewidth: type("string.numeric.parse"),
    tileheight: type("string.numeric.parse"),
    infinite: type("boolean").optional(),
    backgroundcolor: type("string").optional(),
    nextlayerid: type("string.numeric.parse").optional(),
    nextobjectid: type("string.numeric.parse").optional(),
    staggeraxis: type("string").optional(),
    staggerindex: type("string").optional(),
    compressionlevel: type("string.numeric.parse").optional(),
    hexsidelength: type("string.numeric.parse").optional(),
    parallaxoriginx: type("string.numeric.parse").optional(),
    parallaxoriginy: type("string.numeric.parse").optional(),
    tileset: externalTilesetDataSchema.array().default(() => []),
    layer: type("object | object[]").pipe((layer) => {
        if (Array.isArray(layer)) {
            return layer.map(layerData => {
                return TilelayerDataSchema(layerData);
            })
        }
        return [TilelayerDataSchema(layer)];
    }).default(() => []),
})
export type TilemapData = typeof TilemapDataSchema.infer;

export const TilemapSchema = type({
    "?xml": TilemapMetadataSchema,
    "map": TilemapDataSchema
})
export type Tilemap = typeof TilemapSchema.infer;