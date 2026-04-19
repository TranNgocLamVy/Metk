import { type } from "arktype";
import { RootLayerSchema } from "./layerSchema";
import { safeArray } from ".";
import { TilesetRefDataSchema } from "./tilesetSchema";
import { RulesetRefDataSchema } from "./ruleSchema";

export const TilemapMetadataSchema = type({
    name: type("string").default("Untitled Tilemap"),
    id: type("string"),
    tilemapRelPath: type("string"),
})
export type TilemapMetadata = typeof TilemapMetadataSchema.infer

export const tilemapOrientationSchema = type("'orthogonal' | 'isometric' | 'oblique' | 'staggered' | 'hexagonal'")
export type TilemapOrientation = typeof tilemapOrientationSchema.infer

export const TilemapDataSchema = type("string.json.parse").to(type({
    id: type("string"),
    name: type("string").default("Untitled Tilemap"),
    orientation: tilemapOrientationSchema.default("orthogonal"),
    height: type("number").default(64),
    width: type("number").default(64),
    tilewidth: type("number").default(16),
    tileheight: type("number").default(16),
    backgroundcolor: type("string").optional(),
    nextTilesetIndex: type("number").optional(),
    tilesets: safeArray(TilesetRefDataSchema).default(() => []),
    rulesets: safeArray(RulesetRefDataSchema).default(() => []),
    layers: RootLayerSchema,
}))
export type TilemapData = typeof TilemapDataSchema.infer;