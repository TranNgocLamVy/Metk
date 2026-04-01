import { type } from "arktype";
import { safeArray } from ".";

export const atConstraint = type("'ANY' | 'REQUIRE' | 'EMPTY' | 'NOT'")
export type ATConstraint = typeof atConstraint.infer;

export const aTRuleConstraintSchema = type({
    constraint: atConstraint.default("ANY"),
    targets: safeArray(type("string")).default(() => []),
})
export type ATRuleConstraintData = typeof aTRuleConstraintSchema.infer;

export const atOutputSchema = type({
    tileId: type("number"),
    tilesetIndex: type("number"),
})
export type ATOutputData = typeof atOutputSchema.infer;

export const atRuleData = type({
    id: type("string"),
    size: type({
        width: type("number"),
        height: type("number"),
    }).default(() => ({ width: 1, height: 1 })),
    constraints: safeArray(aTRuleConstraintSchema).default(() => []),
    output: atOutputSchema.or("null").default(null),
})
export type ATRuleData = typeof atRuleData.infer;

export const atRuleSetSchema = type({
    id: type("string"),
    name: type("string").default("Untitled AT Rule Set"),
    color: type("string").default("#ffffff"),
    rules: safeArray(atRuleData).default(() => []),
})
export type ATRuleSetData = typeof atRuleSetSchema.infer;