import { ATRule } from "@/core/application/atrule/atRule";
import { ATRuleset } from "@/core/application/atrule/atRuleset";
import { create } from "zustand";



type EditRulesetState = {
    version: number;
    ruleset: ATRuleset;
    selectedRule: string | null;

    setVersion: (version: number) => void;
    setRuleset: (ruleset: ATRuleset) => void;
    setSelectedRule: (rule: string | null) => void;
    refresh: () => void;
}

export const useEditRulesetStore = create<EditRulesetState>((set, get) => ({
    version: 0,
    ruleset: null!,
    selectedRule: null,

    setVersion: (version) => set({ version }),
    setRuleset: (ruleset) => set({ ruleset }),
    setSelectedRule: (rule) => set({ selectedRule: rule }),
    refresh: () => set({ version: get().version + 1 }),
}));