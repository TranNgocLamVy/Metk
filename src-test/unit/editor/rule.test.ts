import { describe, expect, it } from "vitest";

import { Rule } from "@/editor/model/ruleset/rule";
import { RuleRequirement } from "@/shared/data-types/ruleset.data";
import { createReferenceContext, loadRulesetRefs, loadTilesetRefs } from "./editor-test-utils";

const createRule = () => {
    const context = createReferenceContext({ tilesets: ["tileset-a", "tileset-b"], rulesets: ["ruleset-a", "ruleset-b"] });
    loadTilesetRefs(context.tilesetRefManager, ["tileset-a", "tileset-b"]);
    loadRulesetRefs(context.rulesetRefManager, ["ruleset-a", "ruleset-b"]);
    const rule = new Rule(
        {
            id: "rule-1",
            constraints: "0:0:,2:1:0,3:0:1",
            outputs: "7:0:3,8:1:2,invalid:1:1",
        },
        3,
        context.tilesetRefManager,
        context.rulesetRefManager,
    );

    return { rule, context };
};

describe("Rule", () => {
    it("pads missing constraints and evaluates requirements against ruleset ids", () => {
        const { rule } = createRule();

        expect(rule.getConsrtaints()).toHaveLength(9);
        expect(rule.getConstraint(0).getRequirement()).toBe(RuleRequirement.ANY);
        expect(rule.getConstraint(1).getTargetIds()).toEqual(["ruleset-a"]);
        expect(rule.isSatisfied([
            [null, { rulesetId: "ruleset-a" }, null],
            [null, { rulesetId: "ruleset-a" }, null],
            [null, null, null],
        ])).toBe(true);
        expect(rule.isSatisfied([
            [null, { rulesetId: "ruleset-b" }, null],
            [null, { rulesetId: "ruleset-a" }, null],
            [null, null, null],
        ])).toBe(false);
        expect(rule.isSatisfied([
            [null, { rulesetId: "ruleset-a" }, { rulesetId: "ruleset-b" }],
            [null, { rulesetId: "ruleset-a" }, null],
            [null, null, null],
        ])).toBe(false);
    });

    it("returns the first valid output using public tileset ids", () => {
        const { rule } = createRule();

        expect(rule.calculateOutput()).toEqual({ tileId: 7, tilesetId: "tileset-a" });
        expect(rule.getOutputs().map((output) => output.getOutputData())).toEqual([
            { tileId: 7, tilesetId: "tileset-a", weight: 3 },
            { tileId: 8, tilesetId: "tileset-b", weight: 2 },
        ]);
    });

    it("updates outputs and removes references from serialized rule data", () => {
        const { rule } = createRule();

        rule.addOutput(11, "tileset-b", 4);
        rule.removeOutput(7, "tileset-a");
        rule.removeRulesetRef(0);
        rule.removeTilesetRef(1);

        expect(rule.serialize().outputs).toBe("");
        expect(rule.getConstraint(1).getTargetIds()).toEqual([]);
    });
});
