import { create } from "zustand";
import { ATRulesetSession } from "@/core/application/session/atRulesetSession";



type EditRulesetState = {
    version: number;
    session: ATRulesetSession;

    setSession: (session: ATRulesetSession) => void;
    setSelectedRule: (ruleId: string | null) => void;
    refresh: () => void;
}

export const useEditRulesetStore = create<EditRulesetState>((set, get) => ({
    version: 0,
    session: null!,

    setSession: (session) => set({ session }),
    setSelectedRule: (ruleId) => {
        const session = get().session;
        if (session) {
            session.setSelectedRule(ruleId);
            set({ version: get().version + 1 });
        }
    },

    refresh: () => set({ version: get().version + 1 }),
}));