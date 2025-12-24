import { type } from "arktype";

const layerModule = type.module({
    TileRefSchema: {
        tileId: type("number"),
        tilesetIndex: type("number")
    },
    TileLayerSchema: {
        id: type("string"),
        layerType: "'tile'",
        name: type("string"),
        x: type("number").optional(),
        y: type("number").optional(),
        width: type("number"),
        height: type("number"),
        opacity: type("number").default(1),
        visible: type("boolean").default(true),
        locked: type("boolean").default(false),
        offsetx: type("number").optional(),
        offsety: type("number").optional(),
        tilesData: "(TileRefSchema | null)[][]",
    },
    GroupLayerSchema: {
        id: type("string"),
        layerType: "'group'",
        name: type("string"),
        opacity: type("number").default(1),
        visible: type("boolean").default(true),
        locked: type("boolean").default(false),
        layers: "unknown[]",
    },
    LayerSchema: "GroupLayerSchema | TileLayerSchema",
    RootSchema: "LayerSchema[]"
});

export const TileRefSchema = layerModule.TileRefSchema
export type TileRefData = typeof TileRefSchema.infer

export const TileLayerSchema = layerModule.TileLayerSchema
export type TileLayerData = typeof TileLayerSchema.infer

export const GroupLayerSchema = layerModule.GroupLayerSchema
export type GroupLayerData = typeof GroupLayerSchema.infer

export type LayerData = TileLayerData | GroupLayerData

export const RootLayerSchema = layerModule.RootSchema
export type RootLayerData = typeof RootLayerSchema.infer