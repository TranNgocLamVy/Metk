import { describe, expect, it } from "vitest";

import { RulesetSessionManager } from "@/application/workspace/session/ruleset-session.manager";

describe("RulesetSessionManager", () => {
    it("restores, updates, clears, and serializes the selected rule id", () => {
        const manager = new RulesetSessionManager({ selectedRuleId: "rule-a" }, {} as any);

        expect(manager.getSelectedRuleId()).toBe("rule-a");

        manager.setSelectedRuleId("rule-b");
        expect(manager.serialize()).toEqual({ selectedRuleId: "rule-b" });

        manager.setSelectedRuleId(null);
        expect(manager.getSelectedRuleId()).toBeNull();
        expect(manager.serialize()).toEqual({ selectedRuleId: null });
    });
});
