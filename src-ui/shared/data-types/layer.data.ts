import { v4 as uuidv4 } from "uuid";
import { ImageSourceData } from "./image-source.data";

export type TileRefData = {
    tilesetId: string;
    tileId: number;
};

export type RulesetRefData = {
    rulesetId: string;
    output?: TileRefData;
};

export const LayerKind = [
    "none",
    "group",
    "tile",
    "rule",
    "entity",
    "image",
] as const;
export type LayerKind = typeof LayerKind[number];

type LayerCommonData = {
    id: string;
    type: LayerKind;
    name?: string;
    opacity?: number;
    visible?: boolean;
    locked?: boolean;
};

type GridLayerData = LayerCommonData & {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    offsetx?: number;
    offsety?: number;
    layerData?: string;
};

export type TileLayerData = GridLayerData & {
    type: "tile";
};

export type RuleLayerData = GridLayerData & {
    type: "rule";
};

export type ImageLayerData = LayerCommonData & {
    type: "image";
    offsetx?: number;
    offsety?: number;
    parallaxx?: number;
    parallaxy?: number;
    tintcolor?: string;
    repeatx?: boolean;
    repeaty?: boolean;
    image?: ImageSourceData;
};

export type EntityRefData = {
    entityCollectionId: string;
    entityDefinitionId: string;
};

export type EntityInstanceData = {
    id: string;
    name?: string;
    entityRef: EntityRefData;
    x: number;
    y: number;
    fields?: Record<string, unknown>;
};

export type EntityLayerData = LayerCommonData & {
    type: "entity";
    offsetx?: number;
    offsety?: number;
    entities: EntityInstanceData[];
};

export type GroupLayerData = LayerCommonData & {
    type: "group";
    open?: boolean;
    layers?: LayerData[];
};

export type LayerData =
    | TileLayerData
    | RuleLayerData
    | ImageLayerData
    | EntityLayerData
    | GroupLayerData;

export type RootLayerData = LayerData[];

export const defaultTileLayerData = (data: Pick<TileLayerData, "width" | "height">): TileLayerData => {
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
        type: "rule",
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

export const defaultEntityLayerData = (): EntityLayerData => {
    return {
        id: uuidv4(),
        name: "New Entity Layer",
        type: "entity",
        offsetx: 0,
        offsety: 0,
        entities: [],
    };
};
