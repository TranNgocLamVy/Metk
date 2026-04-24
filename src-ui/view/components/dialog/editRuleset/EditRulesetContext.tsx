// src-ui/view/components/dialog/EditRulesetContext.tsx
import { createContext, useContext } from "react";
import { Ruleset } from "@/core/application/rule/ruleset";
import { Rule } from "@/core/application/rule/rule";

export type EditRulesetContextType = {
    ruleset: Ruleset;
    selectedRuleId: string | null;
    setSelectedRuleId: (id: string | null) => void;
    selectedRule: Rule | null;
    selectedGrid: number;
    setSelectedGrid: (grid: number) => void;
    selectedTarget: string | null;
    setSelectedTarget: (target: string | null) => void;
    version: number;
    refresh: () => void;
};

export const EditRulesetContext = createContext<EditRulesetContextType | null>(null);

export const useEditRuleset = () => {
    const context = useContext(EditRulesetContext);
    if (!context) throw new Error("useEditRuleset must be used within an EditRulesetProvider");
    return context;
};