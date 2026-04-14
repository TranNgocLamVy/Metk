import { type } from "arktype";
import { safeArray } from ".";
import { TilesetRefDataSchema } from "./tilesetSchema";

export const atConstraint = type("'ANY' | 'REQUIRE' | 'EMPTY' | 'NOT'")
export type ATConstraint = typeof atConstraint.infer;

export const RuleConstraintDataSchema = type({
    constraint: atConstraint.default("ANY"),
    targets: safeArray(type("string")).default(() => []),
})
export type RuleConstraintData = typeof RuleConstraintDataSchema.infer;

export const ATOutputDataSchema = type({
    tileId: type("number"),
    tilesetIndex: type("number"),
    chance: type("number").default(1),
})
export type ATOutputData = {
    tileId: number,
    tilesetIndex: number,
    chance: number,
}

export const RuleDataSchema = type({
    id: type("string"),
    size: type("number").default(1),
    constraints: safeArray(RuleConstraintDataSchema).default(() => []),
    outputs: type("string").default(""),
})
export type RuleDataSchema = typeof RuleDataSchema.infer;

export const RulesetRefDataSchema = type({
    index: type("number"),
    source: type("string"),
    id: type("string"),
    name: type("string").default("Untitled Tileset"),
})
export type RulesetRefData = typeof RulesetRefDataSchema.infer

export const RulesetDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string").default("Untitled AT Rule Set"),
    color: type("string").default("#ffffff"),
    rules: safeArray(RuleDataSchema).default(() => []),
    tilesets: safeArray(TilesetRefDataSchema).default(() => []),
    rulesets: safeArray(RulesetRefDataSchema).default(() => []),
})
export type RulesetData = typeof RulesetDataSchema.infer;


export const RulesetMetadataSchema = type({
    name: type("string").default("Untitled Tilemap"),
    id: type("string"),
    rulesetRelPath: type("string"),
    color: type("string").default("#ffffff"),
})
export type RulesetMetadata = typeof RulesetMetadataSchema.infer