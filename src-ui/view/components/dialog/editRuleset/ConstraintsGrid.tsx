import { HStack, VStack } from "../../custom/stack/Stack";
import { ReactNode, useCallback, useMemo } from "react";
import { Rule } from "@/core/application/rule/rule";
import { CircleQuestionMark, Square, SquareCheck, SquareDashed, SquareX } from "lucide-react";
import { appCore } from "@/core/appcore";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";
import { useEditRuleset } from "./EditRulesetContext";

export default function ConstraintsGrid() {
    const { ruleset, selectedRule, selectedGrid, selectedTarget, version, setSelectedGrid, setSelectedTarget, refresh } = useEditRuleset();

    const gridSize = ruleset.size;

    const constraints = useMemo(() => {
        if (!selectedRule) return [];
        return selectedRule.getConstaints();
    }, [selectedRule, version]);

    const selectedConstraint = useMemo(() => {
        if (!selectedRule) return null;
        return selectedRule.getConstraint(selectedGrid);
    }, [selectedRule, selectedGrid, version]);

    const rulesetList = useMemo(() => {
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return [];
        return currentProject.rulesetManager.serialize();
    }, [version]);

    const constraintsIcon = useMemo(() => [
        { constraint: "EMPTY", icon: <SquareDashed /> },
        { constraint: "NOT_EMPTY", icon: <Square /> },
        { constraint: "IS", icon: <SquareCheck /> },
        { constraint: "NOT", icon: <SquareX /> },
    ], []);

    const handleSelectTarget = useCallback(() => {
        if (!selectedConstraint || !selectedTarget) return;
        if (selectedConstraint.getTargetIds().includes(selectedTarget)) {
            selectedConstraint.removeTarget(selectedTarget);
        } else {
            selectedConstraint.addTarget(selectedTarget);
        }
        refresh();
    }, [selectedTarget, selectedConstraint, refresh]);

    const handleChangeSelectedTarget = useCallback((direction: -1 | 1) => {
        if (!selectedConstraint || !selectedTarget || rulesetList.length === 0) return;
    
        const currentIndex = rulesetList.findIndex((r) => r.id === selectedTarget);
        if (currentIndex === -1) return;
    
        const listLength = rulesetList.length;
        const nextIndex = (currentIndex + direction + listLength) % listLength;
    
        setSelectedTarget(rulesetList[nextIndex].id);
    }, [selectedConstraint, selectedTarget, rulesetList, setSelectedTarget]);

    const onSelect = (index: number) => {
        if (selectedGrid !== index) {
            setSelectedGrid(index);
            return;
        }
        const constraint = selectedRule!.getConstraint(index);
        switch (constraint.getRequirement()) {
            case "ANY": constraint.setRequirement("EMPTY"); break;
            case "EMPTY": constraint.setRequirement("NOT_EMPTY"); break;
            case "NOT_EMPTY": constraint.setRequirement("IS"); break;
            case "IS": constraint.setRequirement("NOT"); break;
            case "NOT": constraint.setRequirement("ANY"); break;
        }
        console.log(constraint);
        refresh();
    };

    const middleIndex = ((gridSize * gridSize) - 1) / 2;

    return (
        <div className="w-full gap-2 grid" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
            {constraints.map((constraint, index) => {
                const firstConstraintColor = rulesetList.find((r) => constraint.getTargetIds().includes(r.id))?.color ?? null;
                const isEmpyOrAny = constraint.getRequirement() === "EMPTY" || constraint.getRequirement() === "ANY";
                const currentRulesetColor = ruleset.color;

                if (index === middleIndex) {
                    return (
                        <div key={index} className="aspect-square bg-surface-overlay relative p-2 flex items-center justify-center cursor-not-allowed">
                            <div className="w-full h-full" style={{ backgroundColor: currentRulesetColor }} />
                        </div>
                    );
                }

                return (
                    <CellToolTip key={index} rule={selectedRule!} gridIndex={index} version={version}>
                        <div
                            onClick={() => onSelect(index)}
                            onContextMenu={handleSelectTarget}
                            onWheel={(e) => {
                                if (e.deltaY > 0) handleChangeSelectedTarget(1);
                                if (e.deltaY < 0) handleChangeSelectedTarget(-1);
                            }}
                            className={`aspect-square bg-surface-overlay-sunken relative p-2 flex items-center justify-center ${selectedGrid === index ? "ring-2 ring-accent" : "border border-foreground/20 hover:ring-2 hover:ring-accent hover:border-transparent"}`}
                        >
                            {firstConstraintColor && <div className="w-full h-full" style={{ backgroundColor: isEmpyOrAny ? "transparent" : firstConstraintColor }} />}
                            <div className="absolute">
                                {constraintsIcon.find((icon) => icon.constraint === constraint.getRequirement())?.icon}
                            </div>
                        </div>
                    </CellToolTip>
                );
            })}
        </div>
    );
}

function CellToolTip({ version, rule, gridIndex, children }: { version: number, rule: Rule, gridIndex: number, children: ReactNode }) {
    const constraint = useMemo(() => rule.getConstraint(gridIndex), [rule, gridIndex, version]);
    const targets = useMemo(() => constraint.getTargetIds(), [constraint, version]);

    const rulesetList = useMemo(() => {
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return [];
        return currentProject.rulesetManager.serialize();
    }, [version]);

    const constraintsIcon = useMemo(() => [
        { constraint: "ANY", icon: <CircleQuestionMark /> },
        { constraint: "EMPTY", icon: <SquareDashed /> },
        { constraint: "NOT_EMPTY", icon: <Square /> },
        { constraint: "IS", icon: <SquareCheck /> },
        { constraint: "NOT", icon: <SquareX /> },
    ], []);

    const isEmpty = targets.length === 0 || constraint.getRequirement() === "EMPTY" || constraint.getRequirement() === "ANY";

    return (
        <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="w-80 min-h-fit bg-surface-overlay shadow-lg p-2">
                <VStack className="flex-1 gap-4">
                    <HStack align="center" justify="center" className="h-fit w-fit gap-2">
                        <span>Constraint:</span>
                        <span>{constraintsIcon.find((icon) => icon.constraint === constraint.getRequirement())?.icon}</span>
                    </HStack>
                    <VStack className="gap-2">
                        <HStack className="gap-2">
                            <span>Targets:</span>
                            {isEmpty && <span>None</span>}
                        </HStack>
                        <HStack className="w-full flex-wrap">
                            {!isEmpty && targets.map((target) => {
                                const targetRuleset = rulesetList.find((r) => r.id === target);
                                return (
                                    <div key={target} className="w-fit h-fit flex items-center justify-center border border-foreground/20 rounded-md">
                                        <div className="size-8 aspect-square" style={{ backgroundColor: targetRuleset?.color ?? "#ffffff" }} />
                                        <span className="px-2">{targetRuleset?.name}</span>
                                    </div>
                                );
                            })}
                        </HStack>
                    </VStack>
                </VStack>
            </TooltipContent>
        </Tooltip>
    );
}