import { type } from "arktype";

const atRuleModule = type.module({
    ATConstraint: "'ANY' | 'REQUIRE' | 'EMPTY' | 'NOT'",
    ATOutputSchema: {
        tileId: type("number"),
        tilesetIndex: type("number"),
    },
    ATRuleConstraintSchema: {
        constraint: type("'ANY' | 'REQUIRE' | 'EMPTY' | 'NOT'").default("ANY"),
        targets: type("string").array().default(() => []),
    },
    ATRuleData: {
        id: type("string"),
        size: type({
            width: type("number"),
            height: type("number"),
        }).default(() => ({ width: 1, height: 1 })),
        constraints: type({
            targets: type("string").array(),
            constraint: type("'ANY' | 'REQUIRE' | 'EMPTY' | 'NOT'").default("ANY"),
        }).array().default(() => []),
        output: "ATOutputSchema | null",
    },
    ATRuleSetSchema: {
        id: type("string"),
        name: type("string"),
        color: type("string"),
        rules: "ATRuleData[]",
    }
});

export const atConstraint = atRuleModule.ATConstraint;
export type ATConstraint = typeof atConstraint.infer;

export const aTRuleConstraintSchema = atRuleModule.ATRuleConstraintSchema;
export type ATRuleConstraintData = typeof aTRuleConstraintSchema.infer;

export const atOutputSchema = atRuleModule.ATOutputSchema;
export type ATOutputData = typeof atOutputSchema.infer;

export const atRuleData = atRuleModule.ATRuleData;
export type ATRuleData = typeof atRuleData.infer;

export const atRuleSetSchema = atRuleModule.ATRuleSetSchema;
export type ATRuleSetData = typeof atRuleSetSchema.infer;