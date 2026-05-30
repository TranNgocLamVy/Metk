import { RootLayerData } from "./layer.data";
import { RulesetRefData } from "./ruleset.data";
import { TilesetRefData } from "./tileset.data";

export const DEFAULT_TILEMAP_WIDTH = 64;
export const DEFAULT_TILEMAP_HEIGHT = 64;
export const DEFAULT_TILE_SIZE = 16;
export const DEFAULT_TILEMAP_BACKGROUND_COLOR = "#00000000";

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
    tilewidth: number;
    tileheight: number;
    backgroundcolor?: string;
    nextTilesetIndex?: number;
    tilesets: {
        refs: TilesetRefData[];
        nextIndex: number;
    };
    rulesets: {
        refs: RulesetRefData[];
        nextIndex: number;
    };
    layers: RootLayerData;
};
