import { v4 as uuidv4 } from "uuid";

import { type } from "arktype";
import { safeArray } from ".";

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
export const defaultTileLayerData = (data: Pick<TileLayerData, "parentId" | "width" | "height">): TileLayerData => {
    return {
        id: uuidv4(),
        parentId: data.parentId,
        name: "New Tile Layer",
        type: "tile" as const,
        width: data.width,
        height: data.height,
        x: 0,
        y: 0,
        offsetx: 0,
        offsety: 0,
        opacity: 1,
        visible: true,
        locked: false,
        tilesData: ""
    }
}

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
export const defaultGroupLayerData = (data: Pick<GroupLayerData, "parentId">): GroupLayerData => {
    return {
        id: uuidv4(),
        parentId: data.parentId,
        name: "New Group Layer",
        type: "group" as const,
        opacity: 1,
        visible: true,
        locked: false,
    }
}

export const LayerSchema = type(TileLayerSchema).or(GroupLayerSchema);
export type LayerData = typeof LayerSchema.infer

export const RootLayerSchema = safeArray(LayerSchema);
export type RootLayerData = typeof RootLayerSchema.infer