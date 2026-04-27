import { create } from "zustand"

type RulesetDisplayData = {
    id: string,
    name: string,
    color: string,
}

type RulesetStoreState = {
    rulesetDisplayDatas: RulesetDisplayData[],
    currentSelectedRuleId: string | null,
    setRulesetDisplayData: (rulesetDisplayData: RulesetDisplayData[]) => void,
    setCurrentSelectedRuleId: (currentSelectedRuleId: string | null) => void,
}

export const useRulesetStore = create<RulesetStoreState>((set) => ({
    rulesetDisplayDatas: [],
    currentSelectedRuleId: null,
    setRulesetDisplayData: (rulesetDisplayData: RulesetDisplayData[]) => set({ rulesetDisplayDatas: rulesetDisplayData }),
    setCurrentSelectedRuleId: (currentSelectedRuleId: string | null) => set({ currentSelectedRuleId }),
}));