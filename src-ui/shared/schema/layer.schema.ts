import { v4 as uuidv4 } from "uuid";
import { scope } from "arktype";
import { imageSourceSchema } from "./image-source.schema";

export type TileRefData = {
    tilesetId: string;
    tileId: number;
};

export type RulesetRefData = {
    rulesetId: string;
    output?: TileRefData;
}

const layerModule = scope({
    TileLayer: {
        "id": "string",
        "type": "'tile'",
        "name?": "string",
        "x?": "number",
        "y?": "number",
        "width?": "number",
        "height?": "number",
        "opacity?": "number",
        "visible?": "boolean",
        "locked?": "boolean",
        "offsetx?": "number",
        "offsety?": "number",
        "layerData?": "string"
    },

    RuleLayer: {
        "id": "string",
        "type": "'auto_rule'",
        "name?": "string",
        "x?": "number",
        "y?": "number",
        "width?": "number",
        "height?": "number",
        "opacity?": "number",
        "visible?": "boolean",
        "locked?": "boolean",
        "offsetx?": "number",
        "offsety?": "number",
        "layerData?": "string"
    },

    GroupLayer: {
        "id": "string",
        "type": "'group'",
        "name?": "string",
        "opacity?": "number",
        "open?": "boolean",
        "visible?": "boolean",
        "locked?": "boolean",
        "layers?": "Layer[]"
    },

    ImageLayer: {
        "id": "string",
        "type": "'image'",
        "name?": "string",
        "opacity?": "number",
        "visible?": "boolean",
        "locked?": "boolean",
        "offsetx?": "number",
        "offsety?": "number",
        "parallaxx?": "number",
        "parallaxy?": "number",
        "tintcolor?": "string",
        "repeatx?": "boolean",
        "repeaty?": "boolean",
        "image?": imageSourceSchema,
    },

    Layer: "TileLayer | RuleLayer | ImageLayer | GroupLayer",
    RootLayer: "Layer[]"
}).export();

export const TileLayerSchema = layerModule.TileLayer;
export type TileLayerData = typeof TileLayerSchema.infer;

export const RuleLayerSchema = layerModule.RuleLayer;
export type RuleLayerData = typeof RuleLayerSchema.infer;

export const ImageLayerSchema = layerModule.ImageLayer;
export type ImageLayerData = typeof ImageLayerSchema.infer;

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
    };
};

export const defaultRuleLayerData = (data: Pick<RuleLayerData, "width" | "height">): RuleLayerData => {
    return {
        id: uuidv4(),
        name: "New Rule Layer",
        type: "auto_rule",
        width: data.width,
        height: data.height,
    };
};

export const defaultImageLayerData = (): ImageLayerData => {
    return {
        id: uuidv4(),
        name: "New Image Layer",
        type: "image",
    };
};

export const defaultGroupLayerData = (): GroupLayerData => {
    return {
        id: uuidv4(),
        name: "New Group Layer",
        type: "group",
    };
};