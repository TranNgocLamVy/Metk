import { type } from "arktype";
import { safeArray } from ".";
import { TilesetRefDataSchema } from "./tilesetSchema";

export const ruleConstraint = type("'ANY' | 'REQUIRE' | 'EMPTY' | 'NOT'")
export type RuleConstraintType = typeof ruleConstraint.infer;

export const RuleConstraintDataSchema = type({
    constraint: ruleConstraint.default("ANY"),
    targets: safeArray(type("string")).default(() => []),
})
export type RuleConstraintData = typeof RuleConstraintDataSchema.infer;

export const RuleOutputDataSchema = type({
    tileId: type("number"),
    tilesetIndex: type("number"),
    chance: type("number").default(1),
})
export type RuleOutputData = {
    tileId: number,
    tilesetIndex: number,
    chance: number,
}

export const RuleData = type({
    id: type("string"),
    constraints: safeArray(RuleConstraintDataSchema).default(() => []),
    outputs: type("string").default(""),
})
export type RuleData = typeof RuleData.infer;

export const RulesetRefDataSchema = type({
    index: type("number"),
    source: type("string"),
    id: type("string"),
    name: type("string").default("Untitled Ruleset"),
})
export type RulesetRefData = typeof RulesetRefDataSchema.infer

export const RulesetDataSchema = type("string.json.parse").to({
    id: type("string"),
    name: type("string").default("Untitled Rule Set"),
    color: type("string").default("#ffffff"),
    size: type("number").default(5),
    rules: safeArray(RuleData).default(() => []),
    tilesets: type({
        refs: safeArray(TilesetRefDataSchema).default(() => []),
        nextIndex: type("number").default(0),
    }),
    rulesets: type({
        refs: safeArray(RulesetRefDataSchema).default(() => []),
        nextIndex: type("number").default(0),
    }),
})
export type RulesetData = typeof RulesetDataSchema.infer;


export const RulesetMetadataSchema = type({
    name: type("string").default("Untitled Tilemap"),
    id: type("string"),
    rulesetRelPath: type("string"),
    color: type("string").default("#ffffff"),
})
export type RulesetMetadata = typeof RulesetMetadataSchema.infer