import { type } from "arktype";

const tileRefDataSchema = type({
    tileId: type("number"),
    tilesetId: type("string"),
})
export type TileRefData = typeof tileRefDataSchema.infer;

const TilelayerDataSchema = type({
    id: type("string"),
    name: type("string"),
    x: type("number").optional(),
    y: type("number").optional(),
    width: type("number"),
    height: type("number"),
    opacity: type("number").default(1),
    visible: type("boolean").default(true),
    locked: type("boolean").default(false),
    offsetx: type("number").default(0),
    offsety: type("number").default(0),
    tilesData: tileRefDataSchema.array().default(() => []),
})
export type TileLayerData = typeof TilelayerDataSchema.infer;

export const TilemapMetaDataSchema = type({
    id: type("string"),
    name: type("string"),
    tilemapRelPath: type("string"),
})
export type TilemapMetaData = typeof TilemapMetaDataSchema.infer

export const TilesetRefDataSchema = type({
    source: type("string"),
    id: type("string"),
    name: type("string"),
})
export type TilesetRefData = typeof TilesetRefDataSchema.infer

export const TilemapDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string"),
    height: type("number"),
    width: type("number"),
    tilewidth: type("number"),
    tileheight: type("number"),
    infinite: type("boolean").optional(),
    backgroundcolor: type("string").optional(),
    nextlayerid: type("number").optional(),
    nextobjectid: type("number").optional(),
    tileset: TilesetRefDataSchema.array().default(() => []),
    layers: TilelayerDataSchema.array().default(() => []),
})
export type TilemapData = typeof TilemapDataSchema.infer;