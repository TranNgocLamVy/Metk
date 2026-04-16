import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { VStack } from "../../custom/stack/Stack";
import { useCallback, useMemo } from "react";
import { Check, CircleQuestionMark, SquareCheck, SquareDashed, SquareX } from "lucide-react";
import { AppCore } from "@/core/appcore";
import { RuleConstraintType } from "@/shared/schema/ruleSchema";

type ConstraintTargetEditorProps = {
    selectedGrid: number;
    selectedTarget: string | null;
    setSelectedTarget: (target: string | null) => void;
};

export default function ConstraintTargetEditor({ selectedGrid, selectedTarget, setSelectedTarget }: ConstraintTargetEditorProps) {
    const { version, session, refresh } = useEditRulesetStore();

    const rule = useMemo(() => {
        return session.getSelectedRule();
    }, [session, version]);

    const selectedConstraint = useMemo(() => {
        return rule?.getConstraint(selectedGrid);
    }, [rule, selectedGrid, version]);

    const selectedTargets = useMemo(() => {
        return selectedConstraint?.getTargets() ?? [];
    }, [selectedConstraint, version]);

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().rulesetManager.serialize();
    }, [version]);

    const handleChangeConstraint = useCallback((constraint: RuleConstraintType) => {
        selectedConstraint?.setConstraint(constraint);
        refresh();
    }, [selectedConstraint, refresh]);

    const handleSelectTarget = useCallback((targetId: string) => {
        if (!selectedConstraint) return;
        if (selectedConstraint.getTargets().includes(targetId)) {
            selectedConstraint.removeTarget(targetId);
        } else {
            selectedConstraint.addTarget(targetId);
        }
        refresh();
    }, [selectedConstraint, refresh]);

    const constraintList = useMemo(() => {
        return [
            { constraint: "ANY", name: "ANY", icon: <CircleQuestionMark /> },
            { constraint: "EMPTY", name: "EMPTY", icon: <SquareDashed /> },
            { constraint: "REQUIRE", name: "REQUIRE", icon: <SquareCheck /> },
            { constraint: "NOT", name: "NOT", icon: <SquareX /> },
        ]
    }, []);

    if (!rule || !selectedConstraint) {
        return <div className="flex-1"></div>;
    }

    return (
        <VStack className="flex-1 gap-4">
            <span className="text-base">Constraint</span>
            <div className="w-full gap-2 grid grid-cols-7">
                {constraintList.map((constraint) => {
                    return (
                        <div
                            key={constraint.constraint}
                            className={`aspect-square bg-background flex flex-col gap-1 items-center justify-center border border-foreground/20 cursor-pointer ${selectedConstraint.getConstraint() === constraint.constraint && "outline-2 outline-select-color"}`}
                            onClick={() => handleChangeConstraint(constraint.constraint as RuleConstraintType)}
                        >
                            {constraint.icon}
                            <span className="text-xs">{constraint.name}</span>
                        </div>
                    )
                })}
            </div>

            <span className="text-base">Targets</span>
            <div className="grid grid-cols-7 w-full gap-2">
                {rulesetList.map((ruleset) => {
                    const outline = selectedTarget === ruleset.id;
                    const selected = selectedTargets.includes(ruleset.id) && selectedConstraint.getConstraint() !== "EMPTY" && selectedConstraint.getConstraint() !== "ANY";
                    const requiredTarget = selectedConstraint.getConstraint() === "REQUIRE" || selectedConstraint.getConstraint() === "NOT";
                    return (
                        <div
                            key={ruleset.id}
                            className={`bg-background flex flex-col cursor-pointer p-2 gap-2 items-center justify-center border border-foreground/20 ${outline && "outline-2 outline-select-color"}`}
                            onClick={() => {
                                if (requiredTarget) handleSelectTarget(ruleset.id);
                                setSelectedTarget(ruleset.id);
                            }}
                        >
                            <div className="size-8 aspect-square relative flex items-center justify-center" style={{ backgroundColor: ruleset.color }}>
                                {selected && <div className="absolute">
                                    <Check size={24} className="text-green-500 p-1 bg-black/10" strokeWidth={4} />
                                </div>}
                            </div>
                            <span className="text-[8px]">{ruleset.name}</span>
                        </div>
                    )
                })}
            </div>
        </VStack>
    )
}