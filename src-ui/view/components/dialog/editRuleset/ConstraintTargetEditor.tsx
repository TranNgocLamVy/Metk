import { VStack } from "../../custom/stack/Stack";
import { useCallback, useMemo } from "react";
import { Check, CircleQuestionMark, Square, SquareCheck, SquareDashed, SquareX } from "lucide-react";
import { appCore } from "@/core/appcore";
import { ConstraintRequirementType } from "@/shared/schema/rulesetSchema";
import { useEditRuleset } from "./EditRulesetContext";

export default function ConstraintTargetEditor() {
    const { selectedRule, selectedGrid, selectedTarget, version, setSelectedTarget, refresh } = useEditRuleset();

    const selectedConstraint = useMemo(() => {
        if (!selectedRule) return null;
        return selectedRule.getConstraint(selectedGrid);
    }, [selectedRule, selectedGrid, version]);

    const selectedTargets = useMemo(() => {
        return selectedConstraint?.getTargetIds() ?? [];
    }, [selectedConstraint, version]);

    const rulesetList = useMemo(() => {
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return [];
        return currentProject.rulesetManager.serialize();
    }, [version]);

    const handleChangeConstraint = useCallback((constraint: ConstraintRequirementType) => {
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

    const constraintList = useMemo(() => [
        { constraint: "ANY", name: "ANY", icon: <CircleQuestionMark /> },
        { constraint: "EMPTY", name: "EMPTY", icon: <SquareDashed /> },
        { constraint: "NOT_EMPTY", name: "NOT_EMPTY", icon: <Square /> },
        { constraint: "IS", name: "IS", icon: <SquareCheck /> },
        { constraint: "NOT", name: "NOT", icon: <SquareX /> },
    ], []);

    if (!selectedRule || !selectedConstraint) {
        return <div className="flex-1" />;
    }

    return (
        <VStack className="flex-1 gap-4">
            <span className="text-base">Constraint</span>
            <div className="w-full gap-2 grid grid-cols-7">
                {constraintList.map((constraint) => (
                    <div
                        key={constraint.constraint}
                        className={`aspect-square bg-surface-overlay-sunken flex flex-col gap-1 items-center justify-center border border-foreground/20 cursor-pointer ${selectedConstraint.getRequirement() === constraint.constraint && "outline-2 outline-accent"}`}
                        onClick={() => handleChangeConstraint(constraint.constraint as ConstraintRequirementType)}
                    >
                        {constraint.icon}
                        <span className="text-xs">{constraint.name}</span>
                    </div>
                ))}
            </div>

            <span className="text-base">Targets</span>
            <div className="grid grid-cols-7 w-full gap-2">
                {rulesetList.map((ruleset) => {
                    const outline = selectedTarget === ruleset.id;
                    const selected = selectedTargets.includes(ruleset.id) && selectedConstraint.getRequirement() !== "EMPTY" && selectedConstraint.getRequirement() !== "ANY";
                    const requiredTarget = selectedConstraint.getRequirement() === "IS" || selectedConstraint.getRequirement() === "NOT";
                    
                    return (
                        <div
                            key={ruleset.id}
                            className={`bg-surface-overlay-sunken flex flex-col cursor-pointer p-2 gap-2 items-center justify-center border border-foreground/20 ${outline && "outline-2 outline-accent"}`}
                            onClick={() => {
                                if (requiredTarget) handleSelectTarget(ruleset.id);
                                setSelectedTarget(ruleset.id);
                            }}
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
    );
}