import { create } from "zustand"

type RulesetDisplayData = {
    id: string,
    name: string,
    color: string,
}

type RulesetState = {
    rulesetDisplayDatas: RulesetDisplayData[],
    currentSelectedRuleId: string | null,
}

type RulesetActions = {
    setRulesetDisplayData: (rulesetDisplayData: RulesetDisplayData[]) => void,
    setCurrentSelectedRuleId: (currentSelectedRuleId: string | null) => void,
}

type RulesetStore = RulesetState & {
    actions: RulesetActions;
}

const useRulesetStore = create<RulesetStore>((set) => ({
    rulesetDisplayDatas: [],
    currentSelectedRuleId: null,
    actions: {
        setRulesetDisplayData: (rulesetDisplayData) => set({ rulesetDisplayDatas: rulesetDisplayData }),
        setCurrentSelectedRuleId: (currentSelectedRuleId) => set({ currentSelectedRuleId }),
    },
}));

export const useRulesetDisplayDatas = () => useRulesetStore((state) => state.rulesetDisplayDatas);
export const useCurrentSelectedRuleId = () => useRulesetStore((state) => state.currentSelectedRuleId);
export const useRulesetActions = () => useRulesetStore((state) => state.actions);

export const getRulesetStoreState = () => useRulesetStore.getState();
export const resetRulesetStoreForTest = () => useRulesetStore.setState(useRulesetStore.getInitialState(), true);
export const setRulesetStoreStateForTest = (state: Partial<RulesetState>) => useRulesetStore.setState(state);
