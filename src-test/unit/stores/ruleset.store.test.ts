import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { useRulesetStore } from "@/ui/stores/ruleset.store";

describe("useRulesetStore", () => {
    beforeEach(() => {
        resetStore(useRulesetStore);
    });

    it("initializes with no ruleset display data and no selected rule", () => {
        expect(useRulesetStore.getState()).toMatchObject({
            rulesetDisplayDatas: [],
            currentSelectedRuleId: null,
        });
    });

    it("sets ruleset display data", () => {
        const displayData = [{ id: "rule-1", name: "Rule One", color: "#ffffff" }];

        useRulesetStore.getState().setRulesetDisplayData(displayData);

        expect(useRulesetStore.getState().rulesetDisplayDatas).toBe(displayData);
    });

    it("sets the current selected rule id", () => {
        useRulesetStore.getState().setCurrentSelectedRuleId("rule-1");
        expect(useRulesetStore.getState().currentSelectedRuleId).toBe("rule-1");

        useRulesetStore.getState().setCurrentSelectedRuleId(null);
        expect(useRulesetStore.getState().currentSelectedRuleId).toBeNull();
    });
});
