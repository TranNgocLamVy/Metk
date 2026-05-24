import { v4 as uuidv4 } from "uuid";
import { scope, type } from "arktype";

export type TileRefData = {
    tilesetId: string;
    tileId: number;
};

export type RulesetRefData = {
    rulesetId: string;
    output?: TileRefData;
}

export const LayerType = type("'tile' | 'group' | 'auto_rule'");

const layerModule = scope({
    TileLayer: {
        id: "string",
        type: "'tile'",
        name: "string",
        x: "number",
        y: "number",
        width: "number",
        height: "number",
        opacity: "number",
        visible: "boolean",
        locked: "boolean",
        offsetx: "number",
        offsety: "number",
        layerData: "string"
    },

    RuleLayer: {
        id: "string",
        type: "'auto_rule'",
        name: "string",
        x: "number",
        y: "number",
        width: "number",
        height: "number",
        opacity: "number",
        visible: "boolean",
        locked: "boolean",
        offsetx: "number",
        offsety: "number",
        layerData: "string"
    },

    GroupLayer: {
        id: "string",
        type: "'group'",
        name: "string",
        opacity: "number",
        open: "boolean",
        visible: "boolean",
        locked: "boolean",
        layers: "Layer[]"
    },

    Layer: "TileLayer | RuleLayer | GroupLayer",
    RootLayer: "Layer[]"
}).export();

export const TileLayerSchema = layerModule.TileLayer;
export type TileLayerData = typeof TileLayerSchema.infer;

export const RuleLayerSchema = layerModule.RuleLayer;
export type RuleLayerData = typeof RuleLayerSchema.infer;

export const GroupLayerSchema = layerModule.GroupLayer;
export type GroupLayerData = typeof GroupLayerSchema.infer;

export const LayerSchema = layerModule.Layer;
export type LayerData = typeof LayerSchema.infer;

export const RootLayerSchema = layerModule.RootLayer;
export type RootLayerData = typeof RootLayerSchema.infer;

export const defaultTileLayerData = (data: Pick<TileLayerData, | "width" | "height">): TileLayerData => {
    return {
        id: uuidv4(),
        name: "New Tile Layer",
        type: "tile",
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
    };
};

export const defaultRuleLayerData = (data: Pick<RuleLayerData, "width" | "height">): RuleLayerData => {
    return {
        id: uuidv4(),
        name: "New Rule Layer",
        type: "auto_rule",
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
    };
};

export const defaultGroupLayerData = (): GroupLayerData => {
    return {
        id: uuidv4(),
        name: "New Group Layer",
        type: "group",
        opacity: 1,
        open: true,
        visible: true,
        locked: false,
        layers: []
    };
};