import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { HStack, VStack } from "../../custom/stack/Stack";
import { ReactNode, useMemo, useState } from "react";
import { Rule } from "@/core/application/rule/rule";
import { ArrowRight, CircleQuestionMark, SquareCheck, SquareDashed, SquareX } from "lucide-react";
import { AppCore } from "@/core/appcore";
import OutputList from "./OutputList";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";
import { RuleConstraintType } from "@/shared/schema/ruleSchema";

export default function RuleEditor() {
    const { session, version } = useEditRulesetStore();

    const [selectedGrid, setSelectedGrid] = useState<number>(0);

    const rule = useMemo(() => {
        return session.getSelectedRule();
    }, [session, version])

    if (rule === null) return <div className="flex-1"></div>;

    return (
        <HStack className="flex-1 gap-4">
            <VStack className="h-full gap-8">
                <div className="w-full aspect-[7/5] grid grid-cols-7">
                    <div className="col-span-5">
                        <RuleGrid rule={rule} selectedGrid={selectedGrid} setSelectedGrid={setSelectedGrid} />
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                        <ArrowRight />
                    </div>

                    <div className="col-span-1 relative h-full">
                        <div className="absolute inset-0">
                            <OutputList />
                        </div>
                    </div>
                </div>
                <ConstraintEditor rule={rule} selectedGrid={selectedGrid} />
            </VStack>
        </HStack>
    )
}

function RuleGrid({ rule, selectedGrid, setSelectedGrid }: { rule: Rule, selectedGrid: number, setSelectedGrid: (grid: number) => void }) {
    const { version, session, refresh } = useEditRulesetStore();

    const gridSize = useMemo(() => {
        return session.ruleset.size;
    }, [session, version]);

    const constraintts = useMemo(() => {
        return rule.getConstaints();
    }, [rule, version])

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().rulesetManager.serialize();
    }, [version])

    const constrainttsIcon = useMemo(() => {
        return [
            { constraintt: "EMPTY", icon: <SquareDashed /> },
            { constraintt: "REQUIRE", icon: <SquareCheck /> },
            { constraintt: "NOT", icon: <SquareX /> },
        ]
    }, [])

    const onSelect = (index: number) => {
        if (selectedGrid != index) {
            setSelectedGrid(index);
            return;
        }
        switch (rule.getConstraint(index).getConstraint()) {
            case "ANY":
                rule.getConstraint(index).setConstraint("EMPTY");
                break;
            case "EMPTY":
                rule.getConstraint(index).setConstraint("REQUIRE");
                break;
            case "REQUIRE":
                rule.getConstraint(index).setConstraint("NOT");
                break;
            case "NOT":
                rule.getConstraint(index).setConstraint("ANY");
                break;
        }
        refresh();
    }

    const middleIndex = ((gridSize * gridSize) - 1) / 2;

    return (
        <div className={`w-full gap-2 grid`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }} >
            {constraintts.map((constraintt, index) => {
                const firstConstraintColor = rulesetList.find((ruleset) => constraintt.getTargets().includes(ruleset.id))?.color ?? null;
                const isEmpyOrAny = constraintt.getConstraint() === "EMPTY" || constraintt.getConstraint() === "ANY";
                const currentRulesetColor = session.ruleset.color;

                if (index === middleIndex) {
                    return (
                        <div key={index} className={`aspect-square bg-secondary-background relative p-2 flex items-center justify-center border cursor-not-allowed`} >
                            <div className="w-full h-full" style={{ backgroundColor: currentRulesetColor }} />
                        </div>
                    )
                }

                return (
                    <CellToolTip rule={rule} gridIndex={index} key={index} >
                        <div onClick={(e) => onSelect(index)}
                            className={`aspect-square bg-secondary-background relative p-2 flex items-center justify-center border ${selectedGrid === index ? "border-select-color" : "border-foreground/20 hover:border-select-color/50"}`}
                        >
                            {firstConstraintColor && <div className="w-full h-full" style={{ backgroundColor: isEmpyOrAny ? "transparent" : firstConstraintColor }} />}
                            <div className="absolute">
                                {constrainttsIcon.find((icon) => icon.constraintt === constraintt.getConstraint())?.icon}
                            </div>
                        </div>
                    </CellToolTip>
                )
            })}
        </div>
    );
}

function ConstraintEditor({ rule, selectedGrid }: { rule: Rule, selectedGrid: number }) {
    const { version, refresh } = useEditRulesetStore();

    const selectedConstraint = useMemo(() => {
        return rule.getConstraint(selectedGrid);
    }, [rule, selectedGrid, version])

    const selectedTargets = useMemo(() => {
        return selectedConstraint.getTargets();
    }, [selectedConstraint, version])

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().rulesetManager.serialize();
    }, [version])

    const handleChangeConstraint = (constraintt: RuleConstraintType) => {
        selectedConstraint.setConstraint(constraintt);
        refresh();
    }

    const handleSelectTarget = (targetId: string) => {
        if (selectedConstraint.getTargets().includes(targetId)) {
            selectedConstraint.removeTarget(targetId);
        } else {
            selectedConstraint.addTarget(targetId);
        }
        refresh();
    }

    const constrainttList = useMemo(() => {
        return [
            { constraintt: "ANY", name: "ANY", icon: <CircleQuestionMark /> },
            { constraintt: "EMPTY", name: "EMPTY", icon: <SquareDashed /> },
            { constraintt: "REQUIRE", name: "REQUIRE", icon: <SquareCheck /> },
            { constraintt: "NOT", name: "NOT", icon: <SquareX /> },
        ]
    }, [])

    return (
        <VStack className="flex-1 gap-4">
            <span className="text-base">Constraint</span>
            <div className="w-full gap-2 grid grid-cols-7">
                {constrainttList.map((constraintt) => {
                    return (
                        <div
                            key={constraintt.constraintt}
                            className={`aspect-square bg-secondary-background flex flex-col gap-1 items-center justify-center border cursor-pointer ${selectedConstraint.getConstraint() === constraintt.constraintt ? "border-select-color" : "border-foreground/20"}`}
                            onClick={() => handleChangeConstraint(constraintt.constraintt as RuleConstraintType)}
                        >
                            {constraintt.icon}
                            <span className="text-xs">{constraintt.name}</span>
                        </div>
                    )
                })}
            </div>

            <span className="text-base">Targets</span>
            <div className="grid grid-cols-7 w-full gap-2">
                {rulesetList.map((ruleset) => {
                    const hightlight = selectedTargets.includes(ruleset.id) && selectedConstraint.getConstraint() !== "EMPTY" && selectedConstraint.getConstraint() !== "ANY";
                    const requiredTarget = selectedConstraint.getConstraint() === "REQUIRE" || selectedConstraint.getConstraint() === "NOT";
                    return (
                        <div
                            key={ruleset.id}
                            className={`aspect-square bg-secondary-background flex flex-col p-2 gap-2 items-center justify-center border ${hightlight ? "border-select-color" : "border-foreground/20"} ${requiredTarget ? "hover:border-select-color/50" : ""}`}
                            onClick={() => {
                                if (requiredTarget) handleSelectTarget(ruleset.id);
                            }}
                        >
                            <div className="size-8 aspect-square" style={{ backgroundColor: ruleset.color }} />
                            <span className="text-xs">{ruleset.name}</span>
                        </div>
                    )
                })}
            </div>
        </VStack>
    )
}

function CellToolTip({ rule, gridIndex, children }: { rule: Rule, gridIndex: number, children: ReactNode }) {
    const { version } = useEditRulesetStore();

    const [open, setOpen] = useState(false);

    const constraintt = useMemo(() => {
        return rule.getConstraint(gridIndex);
    }, [rule, gridIndex, version])

    const targets = useMemo(() => {
        return constraintt.getTargets();
    }, [constraintt, version])

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().rulesetManager.serialize();
    }, [version])

    const constrainttsIcon = useMemo(() => {
        return [
            { constraintt: "EMPTY", icon: <SquareDashed /> },
            { constraintt: "REQUIRE", icon: <SquareCheck /> },
            { constraintt: "NOT", icon: <SquareX /> },
            { constraintt: "ANY", icon: <CircleQuestionMark /> },
        ]
    }, [])

    const isEmpty = targets.length === 0 || constraintt.getConstraint() === "EMPTY" || constraintt.getConstraint() === "ANY";

    return (
        <Tooltip open={open} onOpenChange={setOpen} delayDuration={1000}>
            <TooltipTrigger asChild>
                <div onContextMenu={() => setOpen(true)}>
                    {children}
                </div>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                sideOffset={8}
                className="w-80 min-h-fit bg-secondary-background border border-foreground/20 shadow-md p-2"
            >
                <VStack className="flex-1 gap-4">
                    <HStack align="center" justify="center" className="h-fit w-fit gap-2">
                        <span>Constraint:</span>
                        <span>{constrainttsIcon.find((icon) => icon.constraintt === constraintt.getConstraint())?.icon}</span>
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
                                    <div key={target} className="w-fit h-fit flex items-center justify-center bg-secondary-background hover:bg-select-color/20 border border-foreground/20 rounded-md">
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