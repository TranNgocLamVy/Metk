import { type } from "arktype";

export const RulesetSessionManagerSchema = type({
    selectedRuleId: type("string").or("null").default(null),
})
export type RulesetSessionManagerData = typeof RulesetSessionManagerSchema.infer