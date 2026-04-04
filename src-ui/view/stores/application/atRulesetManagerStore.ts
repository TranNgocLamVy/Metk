import { AppCore } from "@/core/appcore";
import { create } from "zustand"



type ATRulesetDisplayData = {
    id: string,
    name: string,
    color: string,
}

type ATRuleManagerStoreState = {
    version: number,
    
    getATRulesetDisplayData: () => ATRulesetDisplayData[],
    refresh: () => void,
}

export const useATRulesetManagerStore = create<ATRuleManagerStoreState>((set) => ({
    version: 0,

    getATRulesetDisplayData: () => {
        const atRulesetManager = AppCore.getIns().projectManager.currentProject?.atRulesetManager;
        if (!atRulesetManager) return [];
        const metadata = atRulesetManager.serialize();
        return metadata.map((metaData) => ({ id: metaData.id, name: metaData.name, color: metaData.color }));
    },
    refresh: () => set((state) => ({ version: (state.version + 1 ) % 100000 })),
}));