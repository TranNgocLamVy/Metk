import { EntityCollectionRefData } from "./entity-collection.data";
import { RootLayerData } from "./layer.data";
import { RulesetRefData } from "./ruleset.data";
import { TilesetRefData } from "./tileset.data";

export type TilemapMetadata = {
    name: string;
    id: string;
    tilemapRelPath: string;
};

export const TilemapOrientationValues = [
    "orthogonal",
    "isometric",
    "oblique",
    "staggered",
    "hexagonal",
] as const;

export type TilemapOrientation = typeof TilemapOrientationValues[number];

export const TilemapOrientation = {
    Orthogonal: "orthogonal",
    Isometric: "isometric",
    Oblique: "oblique",
    Staggered: "staggered",
    Hexagonal: "hexagonal",
} as const satisfies Record<string, TilemapOrientation>;

export type TilemapData = {
    id: string;
    name: string;
    orientation: TilemapOrientation;
    height: number;
    width: number;
    tileWidth: number;
    tileHeight: number;
    backgroundcolor: string;
    tilesets: {
        refs: TilesetRefData[];
        nextIndex: number;
    };
    rulesets: {
        refs: RulesetRefData[];
        nextIndex: number;
    };
    entityCollections: {
        refs: EntityCollectionRefData[];
        nextIndex: number;
    };
    layers: RootLayerData;
};

export type CreateTilemapPayload = Pick<TilemapData, "id" | "name" | "orientation" | "height" | "width" | "tileWidth" | "tileHeight">;