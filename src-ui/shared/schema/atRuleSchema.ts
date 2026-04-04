import { type } from "arktype";
import { safeArray } from ".";
import { TilesetRefDataSchema } from "./tilesetSchema";

export const atConstraint = type("'ANY' | 'REQUIRE' | 'EMPTY' | 'NOT'")
export type ATConstraint = typeof atConstraint.infer;

export const ATRuleConstraintDataSchema = type({
    constraint: atConstraint.default("ANY"),
    targets: safeArray(type("string")).default(() => []),
})
export type ATRuleConstraintData = typeof ATRuleConstraintDataSchema.infer;

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

export const ATRuleDataSchema = type({
    id: type("string"),
    size: type({
        width: type("number"),
        height: type("number"),
    }).default(() => ({ width: 1, height: 1 })),
    constraints: safeArray(ATRuleConstraintDataSchema).default(() => []),
    outputs: type("string").default(""),
})
export type ATRuleDataSchema = typeof ATRuleDataSchema.infer;

export const ATRulesetRefDataSchema = type({
    index: type("number"),
    source: type("string"),
    id: type("string"),
    name: type("string").default("Untitled Tileset"),
})
export type ATRulesetRefData = typeof ATRulesetRefDataSchema.infer

export const ATRulesetDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string").default("Untitled AT Rule Set"),
    color: type("string").default("#ffffff"),
    rules: safeArray(ATRuleDataSchema).default(() => []),
    tilesets: safeArray(TilesetRefDataSchema).default(() => []),
    rulesets: safeArray(ATRulesetRefDataSchema).default(() => []),
})
export type ATRulesetData = typeof ATRulesetDataSchema.infer;


export const ATRulesetMetadataSchema = type({
    name: type("string").default("Untitled Tilemap"),
    id: type("string"),
    atRulesetRelPath: type("string"),
})
export type ATRulesetMetadata = typeof ATRulesetMetadataSchema.infer