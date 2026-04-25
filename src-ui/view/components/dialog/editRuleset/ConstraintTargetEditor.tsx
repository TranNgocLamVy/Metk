import { HStack, VStack } from "../../custom/stack/Stack";
import { useCallback, useMemo } from "react";
import { Check, CircleQuestionMark, SquareCheck, SquareX } from "lucide-react";
import { appCore } from "@/core/appcore";
import { useEditRuleset } from "./EditRulesetContext";
import { RuleRequirement } from "@/shared/schema/rulesetSchema";
import { Checkbox } from "../../shadcn/checkbox";
import { useTranslation } from "react-i18next";

export default function ConstraintTargetEditor() {
    const { t: translate } = useTranslation();

    const { selectedRule, selectedGrid, version, refresh } = useEditRuleset();

    const selectedConstraint = useMemo(() => {
        if (!selectedRule) return null;
        return selectedRule.getConstraint(selectedGrid);
    }, [selectedRule, selectedGrid, version]);

    const allowEmpty = useMemo(() => selectedConstraint?.getAllowEmpty() ?? false, [selectedConstraint, version]);

    const selectedTargets = useMemo(() => {
        return selectedConstraint?.getTargetIds() ?? [];
    }, [selectedConstraint, version]);

    const rulesetList = useMemo(() => {
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return [];
        return currentProject.rulesetManager.serialize();
    }, [version]);

    const handleChangeConstraint = useCallback((constraint: RuleRequirement) => {
        if (!selectedConstraint) return;
        selectedConstraint.setRequirement(constraint);
        refresh();
    }, [selectedConstraint, refresh]);

    const handleSelectTarget = useCallback((targetId: string) => {
        if (!selectedConstraint) return;
        if (selectedConstraint.getTargetIds().includes(targetId)) {
            selectedConstraint.removeTarget(targetId);
        } else {
            selectedConstraint.addTarget(targetId);
        }
        refresh();
    }, [selectedConstraint, refresh]);

    const requirementList = useMemo(() => [
        { requirement: RuleRequirement.ANY, name: "ANY", icon: <CircleQuestionMark /> },
        { requirement: RuleRequirement.IS, name: "IS", icon: <SquareCheck /> },
        { requirement: RuleRequirement.NOT, name: "NOT", icon: <SquareX /> },
    ], []);

    if (!selectedRule || !selectedConstraint) {
        return <div className="flex-1" />;
    }

    const handleChangeAllowEmpty = () => {
        selectedConstraint.setAllowEmpty(!selectedConstraint.getAllowEmpty());
        refresh();
    }

    return (
        <VStack className="flex-1 gap-6">
            <VStack className="gap-2">
                <span className="text-base">{translate("dialog.editRuleset.requirement")}</span>
                <div className="w-full gap-2 grid grid-cols-7">
                    {requirementList.map((requirement) => {
                        const selected = selectedConstraint.getRequirement() === requirement.requirement;
                        return (
                            <div
                                key={requirement.requirement}
                                className={`aspect-square bg-surface-overlay-sunken flex flex-col gap-1 items-center justify-center border border-foreground/20 cursor-pointer ${selected && "outline-2 outline-accent"}`}
                                onClick={() => handleChangeConstraint(requirement.requirement)}
                            >
                                {requirement.icon}
                                <span className="text-xs">{requirement.name}</span>
                            </div>
                        )
                    })}
                </div>
            </VStack>

            <HStack align="center" className="w-full h-fit gap-2">
                <Checkbox checked={allowEmpty} onCheckedChange={handleChangeAllowEmpty} />
                <span className="text-base">{translate("dialog.editRuleset.allowEmpty")}</span>
            </HStack>

            <VStack className="gap-2">
                <span className="text-base">{translate("dialog.editRuleset.targets")}</span>
                <div className="grid grid-cols-7 w-full gap-2">
                    {rulesetList.map((ruleset) => {
                        const selected = selectedTargets.includes(ruleset.id) && selectedConstraint.getRequirement() !== RuleRequirement.ANY;
                        const needTarget = selectedConstraint.getRequirement() === RuleRequirement.IS || selectedConstraint.getRequirement() === RuleRequirement.NOT;
                        return (
                            <div
                                key={ruleset.id}
                                className={`bg-surface-overlay-sunken flex flex-col cursor-pointer p-2 gap-2 items-center justify-center border border-foreground/20 ${selected && "outline-2 outline-accent"}`}
                                onClick={() => { if (needTarget) handleSelectTarget(ruleset.id) }}
                            >
                                <div className="size-8 aspect-square relative flex items-center justify-center" style={{ backgroundColor: ruleset.color }}>
                                    {selected && (
                                        <div className="absolute">
                                            <Check size={24} className="text-green-500 p-1 bg-black/10" strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                                <span className="text-[8px]">{ruleset.name}</span>
                            </div>
                        );
                    })}
                </div>
            </VStack>
        </VStack>
    );
}