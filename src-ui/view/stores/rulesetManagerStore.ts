import { AppCore } from "@/core/appcore";
import { create } from "zustand"

type RulesetDisplayData = {
    id: string,
    name: string,
    color: string,
}

type RuleManagerStoreState = {
    version: number,
    
    getRulesetDisplayData: () => RulesetDisplayData[],
    refresh: () => void,
}

export const useRulesetManagerStore = create<RuleManagerStoreState>((set) => ({
    version: 0,

    getRulesetDisplayData: () => {
        const rulesetManager = AppCore.getIns().projectManager.currentProject?.rulesetManager;
        if (!rulesetManager) return [];
        const metadata = rulesetManager.serialize();
        return metadata.map((metaData) => ({ id: metaData.id, name: metaData.name, color: metaData.color }));
    },
    refresh: () => set((state) => ({ version: (state.version + 1 ) % 100000 })),
}));