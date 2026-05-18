import { type } from "arktype";
import { RootLayerSchema } from "./layer.schema";
import { safeArray } from "./utils";
import { TilesetRefDataSchema } from "./tileset.schema";
import { RulesetRefDataSchema } from "./ruleset.schema";

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
    tilesets: type({
        refs: safeArray(TilesetRefDataSchema).default(() => []),
        nextIndex: type("number").default(0),
    }),
    rulesets: type({
        refs: safeArray(RulesetRefDataSchema).default(() => []),
        nextIndex: type("number").default(0),
    }),
    layers: RootLayerSchema,
}))
export type TilemapData = typeof TilemapDataSchema.infer;