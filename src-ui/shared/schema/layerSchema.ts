import { type } from "arktype";
import { safeArray } from ".";

const layerModule = type.module({
    LayerType: "'tile' | 'group'",
    TileRefSchema: {
        tileId: type("number"),
        tilesetIndex: type("number")
    },
    TileLayerSchema: {
        id: type("string"),
        layerType: "LayerType",
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
        layerType: "LayerType",
        name: type("string"),
        opacity: type("number").default(1),
        visible: type("boolean").default(true),
        locked: type("boolean").default(false),
        layers: "unknown[]",
    },
    LayerSchema: "GroupLayerSchema | TileLayerSchema",
    RootSchema: "LayerSchema[]"
});

export type TileRefData = {
    tileId: number,
    tilesetIndex: number
}

export const LayerType = type("'tile' | 'group' | 'auto_rule'");

export const TileLayerSchema = type({
    id: type("string"),
    parentId: type("string").default("root"),
    type: type("'tile'"),
    name: type("string").default("Untitled Layer"),
    x: type("number").default(0),
    y: type("number").default(0),
    width: type("number").default(0),
    height: type("number").default(0),
    opacity: type("number").default(1),
    visible: type("boolean").default(true),
    locked: type("boolean").default(false),
    offsetx: type("number").default(0),
    offsety: type("number").default(0),
    tilesData: type("string").default("")
})
export type TileLayerData = typeof TileLayerSchema.infer

export const GroupLayerSchema = type({
    id: type("string"),
    parentId: type("string").default("root"),
    type: type("'group'"),
    name: type("string").default("Untitled Layer"),
    opacity: type("number").default(1),
    visible: type("boolean").default(true),
    locked: type("boolean").default(false),
})
export type GroupLayerData = typeof GroupLayerSchema.infer

export const LayerSchema = type(TileLayerSchema).or(GroupLayerSchema);
export type LayerData = typeof LayerSchema.infer

export const RootLayerSchema = safeArray(LayerSchema);
export type RootLayerData = typeof RootLayerSchema.infer