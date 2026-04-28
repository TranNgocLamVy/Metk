import { v4 as uuidv4 } from "uuid";

import { type } from "arktype";
import { safeArray } from ".";

export type TileRefData = {
    tilesetId: string,
    tileId: number,
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
    layerData: type("string").default("")
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
        layerData: ""
    }
}

export type RulesetRefData = {
    rulesetId: string,
    output?: {
        tileId: number,
        tilesetId: string
    }
}

export const RuleLayerSchema = type({
    id: type("string"),
    parentId: type("string").default("root"),
    type: type("'auto_rule'"),
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
    layerData: type("string").default("")
})
export type RuleLayerData = typeof RuleLayerSchema.infer
export const defaultRuleLayerData = (data: Pick<RuleLayerData, "parentId" | "width" | "height">): RuleLayerData => {
    return {
        id: uuidv4(),
        parentId: data.parentId,
        name: "New Rule Layer",
        type: "auto_rule" as const,
        width: data.width,
        height: data.height,
        x: 0,
        y: 0,
        offsetx: 0,
        offsety: 0,
        opacity: 1,
        visible: true,
        locked: false,
        layerData: ""
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

export const LayerSchema = type(TileLayerSchema).or(RuleLayerSchema).or(GroupLayerSchema);
export type LayerData = typeof LayerSchema.infer

export const RootLayerSchema = safeArray(LayerSchema);
export type RootLayerData = typeof RootLayerSchema.infer