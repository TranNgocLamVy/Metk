import { type } from "arktype";

import { RootLayerSchema } from "./layerSchema";

const tilemapModule = type.module({
    TilemapMetaDataSchema: {
        id: type("string"),
        name: type("string"),
        tilemapRelPath: type("string"),
    },
    TilesetRefDataSchema: {
        index: type("number"),
        source: type("string"),
        id: type("string"),
        name: type("string"),
    },
    TilemapDataSchema: {
        id: type("string"),
        name: type("string"),
        height: type("number"),
        width: type("number"),
        tilewidth: type("number"),
        tileheight: type("number"),
        infinite: type("boolean").optional(),
        backgroundcolor: type("string").optional(),
        nextTilesetIndex: type("number").optional(),
        tileset: "TilesetRefDataSchema[]",
        layers: RootLayerSchema,
    },
})

export const TilemapMetaDataSchema = tilemapModule.TilemapMetaDataSchema
export type TilemapMetaData = typeof TilemapMetaDataSchema.infer

export const TilesetRefDataSchema = tilemapModule.TilesetRefDataSchema
export type TilesetRefData = typeof TilesetRefDataSchema.infer

export const TilemapDataSchema = type("string.json.parse").to(tilemapModule.TilemapDataSchema)
export type TilemapData = typeof TilemapDataSchema.infer;