import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { HStack, VStack } from "../../custom/stack/Stack";
import { ReactNode, useCallback, useMemo } from "react";
import { Rule } from "@/core/application/rule/rule";
import { CircleQuestionMark, SquareCheck, SquareDashed, SquareX } from "lucide-react";
import { AppCore } from "@/core/appcore";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";


type ConstraintsGridProps = {
    selectedGrid: number;
    setSelectedGrid: (grid: number) => void;
    selectedTarget: string | null;
    setSelectedTarget: (target: string | null) => void;
};

export default function ConstraintsGrid({ selectedGrid, setSelectedGrid, selectedTarget, setSelectedTarget }: ConstraintsGridProps) {
    const { version, session, refresh } = useEditRulesetStore();

    const rule = useMemo(() => {
        return session.getSelectedRule();
    }, [session, version]);

    const gridSize = useMemo(() => {
        return session.ruleset.size;
    }, [session, version]);

    const constraints = useMemo(() => {
        if (!rule) return [];
        return rule.getConstaints();
    }, [rule, version])

    const selectedConstraint = useMemo(() => {
        return rule?.getConstraint(selectedGrid);
    }, [rule, selectedGrid, version]);

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().rulesetManager.serialize();
    }, [version]) 

    const constraintsIcon = useMemo(() => {
        return [
            { constraint: "EMPTY", icon: <SquareDashed /> },
            { constraint: "REQUIRE", icon: <SquareCheck /> },
            { constraint: "NOT", icon: <SquareX /> },
        ]
    }, [])

    const handleSelectTarget = useCallback(() => {
        if (!selectedConstraint) return;
        if (!selectedTarget) return;
        if (selectedConstraint.getTargets().includes(selectedTarget)) {
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
        if (selectedGrid != index) {
            setSelectedGrid(index);
            return;
        }
        switch (rule!.getConstraint(index).getConstraint()) {
            case "ANY":
                rule!.getConstraint(index).setConstraint("EMPTY");
                break;
            case "EMPTY":
                rule!.getConstraint(index).setConstraint("REQUIRE");
                break;
            case "REQUIRE":
                rule!.getConstraint(index).setConstraint("NOT");
                break;
            case "NOT":
                rule!.getConstraint(index).setConstraint("ANY");
                break;
        }
        refresh();
    }

    const middleIndex = ((gridSize * gridSize) - 1) / 2;

    return (
        <div className={`w-full gap-2 grid`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }} >
            {constraints.map((constraint, index) => {
                const firstConstraintColor = rulesetList.find((ruleset) => constraint.getTargets().includes(ruleset.id))?.color ?? null;
                const isEmpyOrAny = constraint.getConstraint() === "EMPTY" || constraint.getConstraint() === "ANY";
                const currentRulesetColor = session.ruleset.color;

                if (index === middleIndex) {
                    return (
                        <div key={index} className={`aspect-square bg-surface-overlay relative p-2 flex items-center justify-center cursor-not-allowed`} >
                            <div className="w-full h-full" style={{ backgroundColor: currentRulesetColor }} />
                        </div>
                    )
                }

                return (
                    <CellToolTip rule={rule!} gridIndex={index} key={index} >
                        <div
                            onClick={(e) => onSelect(index)}
                            onContextMenu={() => handleSelectTarget()}
                            onWheel={(e) => {
                                if (e.deltaY > 0) handleChangeSelectedTarget(1);
                                if (e.deltaY < 0) handleChangeSelectedTarget(-1);
                            }}
                            className={`aspect-square bg-surface-overlay-sunken relative p-2 flex items-center justify-center ${selectedGrid === index ? "ring-2 ring-accent" : "border border-foreground/20 hover:ring-2 hover:ring-accent hover:border-transparent"}`}
                        >
                            {firstConstraintColor && <div className="w-full h-full" style={{ backgroundColor: isEmpyOrAny ? "transparent" : firstConstraintColor }} />}
                            <div className="absolute">
                                {constraintsIcon.find((icon) => icon.constraint === constraint.getConstraint())?.icon}
                            </div>
                        </div>
                    </CellToolTip>
                )
            })}
        </div>
    );
}


function CellToolTip({ rule, gridIndex, children }: { rule: Rule, gridIndex: number, children: ReactNode }) {
    const { version } = useEditRulesetStore();

    const constraint = useMemo(() => {
        return rule.getConstraint(gridIndex);
    }, [rule, gridIndex, version])

    const targets = useMemo(() => {
        return constraint.getTargets();
    }, [constraint, version])

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().rulesetManager.serialize();
    }, [version])

    const constraintsIcon = useMemo(() => {
        return [
            { constraint: "EMPTY", icon: <SquareDashed /> },
            { constraint: "REQUIRE", icon: <SquareCheck /> },
            { constraint: "NOT", icon: <SquareX /> },
            { constraint: "ANY", icon: <CircleQuestionMark /> },
        ]
    }, [])

    const isEmpty = targets.length === 0 || constraint.getConstraint() === "EMPTY" || constraint.getConstraint() === "ANY";

    return (
        <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                sideOffset={8}
                className="w-80 min-h-fit bg-surface-overlay shadow-lg p-2"
            >
                <VStack className="flex-1 gap-4">
                    <HStack align="center" justify="center" className="h-fit w-fit gap-2">
                        <span>Constraint:</span>
                        <span>{constraintsIcon.find((icon) => icon.constraint === constraint.getConstraint())?.icon}</span>
                    </HStack>
                    <VStack className="gap-2">
                        <HStack className="gap-2">
                            <span>Targets:</span>
                            {isEmpty && <span>None</span>}
                        </HStack>
                        <HStack className="w-full flex-wrap">
                            {!isEmpty && targets.map((target) => {
                                const ruleset = rulesetList.find((ruleset) => ruleset.id === target);
                                return (
                                    <div key={target} className="w-fit h-fit flex items-center justify-center border border-foreground/20 rounded-md">
                                        <div className="size-8 aspect-square" style={{ backgroundColor: ruleset?.color ?? "#ffffff" }} />
                                        <span className="px-2">{ruleset?.name}</span>
                                    </div>
                                )
                            })}
                        </HStack>
                    </VStack>
                </VStack>
            </TooltipContent>
        </Tooltip>
    )
}