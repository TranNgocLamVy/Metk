import { beforeEach, describe, expect, it } from "vitest";

import { resetStore } from "./store-test-utils";
import { getRulesetStoreState, resetRulesetStoreForTest, setRulesetStoreStateForTest } from "@/ui/stores/ruleset.store";

describe("useRulesetStore", () => {
    beforeEach(() => {
        resetRulesetStoreForTest();
    });

    it("initializes with no ruleset display data and no selected rule", () => {
        expect(getRulesetStoreState()).toMatchObject({
            rulesetDisplayDatas: [],
            currentSelectedRuleId: null,
        });
    });

    it("sets ruleset display data", () => {
        const displayData = [{ id: "rule-1", name: "Rule One", color: "#ffffff" }];

        getRulesetStoreState().actions.setRulesetDisplayData(displayData);

        expect(getRulesetStoreState().rulesetDisplayDatas).toBe(displayData);
    });

    it("sets the current selected rule id", () => {
        getRulesetStoreState().actions.setCurrentSelectedRuleId("rule-1");
        expect(getRulesetStoreState().currentSelectedRuleId).toBe("rule-1");

        getRulesetStoreState().actions.setCurrentSelectedRuleId(null);
        expect(getRulesetStoreState().currentSelectedRuleId).toBeNull();
    });
});
