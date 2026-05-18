import { createContext, useContext } from "react";
import { useState, useCallback, useMemo } from 'react';
import { Ruleset } from '@/editor/application/rule/ruleset';
import { RuleRequirement } from '@/shared/schema/rulesetSchema';
import { RulesetOutputSelector } from './renderer/RulesetOutputSelector';
import { useRulesetStore } from '@/ui/stores/rulesetStore';
import { appCore } from '@/editor/appcore';

export function useRulesetController(initialRuleset: Ruleset) {
    const [version, setVersion] = useState<number>(0);
    const triggerUpdate = useCallback(() => { setVersion((v) => v + 1) }, []);

    const { rulesetDisplayDatas: rulesetList } = useRulesetStore();
    
    const tilesetList = useMemo(() => {
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return [];
        return currentProject.tilesetManager.serialize();
    }, [version])

    const [ruleset] = useState<Ruleset>(initialRuleset);
    const [rulesetSession] = useState<RulesetOutputSelector>(new RulesetOutputSelector(initialRuleset, triggerUpdate));

    const dependedTilesets = useMemo(() => {
        return ruleset.tilesetRefManager.serialize().refs;
    }, [version])

    const ruleList = useMemo(() => ruleset.getAllRules(), [version]);

    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(ruleList.length > 0 ? ruleList[0].id : null);
    const selectedRule = useMemo(() => {
        if (!selectedRuleId) return null;
        rulesetSession.setCurrentRule(ruleset.getRule(selectedRuleId) ?? null);
        return ruleset.getRule(selectedRuleId) ?? null;
    }, [selectedRuleId, version]);

    const ruleOutputs = useMemo(() => {
        if (!selectedRule) return [];
        return selectedRule.getOutputs();
    }, [selectedRule, version]);

    const constraintList = useMemo(() => {
        if (!selectedRule) return [];
        return selectedRule.getConsrtaints();
    }, [selectedRule, version]);
    
    const [selectedConstraintIndex, setSelectedConstraintIndex] = useState<number>(0);
    const selectedConstraint = useMemo(() => {
        if (!selectedRule) return null;
        return selectedRule.getConstraint(selectedConstraintIndex);
    }, [selectedRule, selectedConstraintIndex, version]);

    const constraintTargets = useMemo(() => {
        if (!selectedConstraint) return [];
        return selectedConstraint.getTargetIds();
    }, [selectedConstraint, rulesetList, version]);

    const constrainRequirement = useMemo(() => selectedConstraint?.getRequirement() ?? RuleRequirement.ANY, [selectedConstraint, version]);

    const allowEmpty = useMemo(() => selectedConstraint?.getAllowEmpty() ?? false, [selectedConstraint, version]);

    const actions = useMemo(() => ({
        triggerUpdate,
        updateConstraint: (req: RuleRequirement) => {
            if (!selectedRule) return;
            const constraint = selectedRule.getConstraint(selectedConstraintIndex);
            if (constraint) {
                constraint.setRequirement(req);
                triggerUpdate();
            }
        },
        toggleTarget: (targetId: string) => {
            if (!selectedRule) return;
            const constraint = selectedRule.getConstraint(selectedConstraintIndex);
            if (constraint) {
                const targets = constraint.getTargetIds();
                if (targets.includes(targetId)) {
                    constraint.removeTarget(targetId);
                } else {
                    constraint.addTarget(targetId);
                }
            }
            triggerUpdate();
        },
        toggleAllowEmpty: () => {
            if (!selectedRule) return;
            const constraint = selectedRule.getConstraint(selectedConstraintIndex);
            if (constraint) {
                constraint.setAllowEmpty(!constraint.getAllowEmpty());
                triggerUpdate();
            }
        },
        addOutput: (tileId: number, tilesetId: string) => {
            if (!selectedRule) return;
            selectedRule.addOutput(tileId, tilesetId, 1);
            triggerUpdate();
        },
        removeOutput: (tileId: number, tilesetId: string) => {
            if (!selectedRule) return;
            selectedRule.removeOutput(tileId, tilesetId);
            triggerUpdate();
        },
        duplicateRule: (ruleId: string) => {
            ruleset.duplicateRule(ruleId);
            triggerUpdate();
        },
        removeRule: (ruleId: string) => {
            ruleset.removeRule(ruleId);
            if (selectedRuleId === ruleId) {
                const remaining = ruleset.getAllRules();
                setSelectedRuleId(remaining.length > 0 ? remaining[0].id : null);
            }
            triggerUpdate();
        },
        addEmptyRule: () => {
            ruleset.addEmptyRule();
            triggerUpdate();
        },
        updateRulesetName: (name: string) => {
            ruleset.name = name;
            triggerUpdate();
        },
        updateRulesetColor: (color: string) => {
            ruleset.color = color;
            triggerUpdate();
        },
        selectTileset: async (tilesetId: string) => {
            await rulesetSession.setActiveTileset(tilesetId);
        }
    }), [ruleset, selectedRule, selectedConstraintIndex, selectedRuleId, triggerUpdate]);

    return {
        version,
        triggerUpdate,

        rulesetList,
        tilesetList,
        dependedTilesets,

        ruleset,
        rulesetSession,

        ruleList,
        selectedRuleId,
        selectedRule,
        ruleOutputs,

        constraintList,
        constraintTargets,
        constrainRequirement,
        selectedConstraintIndex,
        selectedConstraint,
        allowEmpty,

        setSelectedRuleId,
        setSelectedConstraintIndex,
        actions
    };
}

export type EditRulesetContextType = ReturnType<typeof useRulesetController>;

export const EditRulesetContext = createContext<EditRulesetContextType | null>(null);

export const useEditRuleset = () => {
    const context = useContext(EditRulesetContext);
    if (!context) throw new Error("useEditRuleset must be used within an EditRulesetProvider");
    return context;
};