import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { HStack, VStack } from "../../custom/stack/Stack";
import { ReactNode, useMemo, useState } from "react";
import { ATRule } from "@/core/application/atrule/atRule";
import { ArrowRight, CircleQuestionMark, SquareCheck, SquareDashed, SquareX } from "lucide-react";
import { AppCore } from "@/core/appcore";
import { ATConstraint } from "@/shared/schema/atRuleSchema";
import OutputList from "./OutputList";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";

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
                <ContrainEditor rule={rule} selectedGrid={selectedGrid} />
            </VStack>
        </HStack>
    )
}

function RuleGrid({ rule, selectedGrid, setSelectedGrid }: { rule: ATRule, selectedGrid: number, setSelectedGrid: (grid: number) => void }) {
    const { version, session, refresh } = useEditRulesetStore();

    const gridSize = useMemo(() => {
        return rule.size;
    }, [session, version]);

    const contraints = useMemo(() => {
        return rule.getConstaints();
    }, [rule, version])

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().atRulesetManager.serialize();
    }, [version])

    const contraintsIcon = useMemo(() => {
        return [
            { constraint: "EMPTY", icon: <SquareDashed /> },
            { constraint: "REQUIRE", icon: <SquareCheck /> },
            { constraint: "NOT", icon: <SquareX /> },
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
            {contraints.map((contraint, index) => {
                const firstContraintColor = rulesetList.find((ruleset) => contraint.getTargets().includes(ruleset.id))?.color ?? null;
                const isEmpyOrAny = contraint.getConstraint() === "EMPTY" || contraint.getConstraint() === "ANY";
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
                            {firstContraintColor && <div className="w-full h-full" style={{ backgroundColor: isEmpyOrAny ? "transparent" : firstContraintColor }} />}
                            <div className="absolute">
                                {contraintsIcon.find((icon) => icon.constraint === contraint.getConstraint())?.icon}
                            </div>
                        </div>
                    </CellToolTip>
                )
            })}
        </div>
    );
}

function ContrainEditor({ rule, selectedGrid }: { rule: ATRule, selectedGrid: number }) {
    const { version, refresh } = useEditRulesetStore();

    const selectedContraint = useMemo(() => {
        return rule.getConstraint(selectedGrid);
    }, [rule, selectedGrid, version])

    const selectedTargets = useMemo(() => {
        return selectedContraint.getTargets();
    }, [selectedContraint, version])

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().atRulesetManager.serialize();
    }, [version])

    const handleChangeConstraint = (constraint: ATConstraint) => {
        selectedContraint.setConstraint(constraint);
        refresh();
    }

    const handleSelectTarget = (targetId: string) => {
        if (selectedContraint.getTargets().includes(targetId)) {
            selectedContraint.removeTarget(targetId);
        } else {
            selectedContraint.addTarget(targetId);
        }
        refresh();
    }

    const constraintList = useMemo(() => {
        return [
            { constraint: "ANY", name: "ANY", icon: <CircleQuestionMark /> },
            { constraint: "EMPTY", name: "EMPTY", icon: <SquareDashed /> },
            { constraint: "REQUIRE", name: "REQUIRE", icon: <SquareCheck /> },
            { constraint: "NOT", name: "NOT", icon: <SquareX /> },
        ]
    }, [])

    return (
        <VStack className="flex-1 gap-4">
            <span className="text-base">Contrain</span>
            <div className="w-full gap-2 grid grid-cols-7">
                {constraintList.map((constraint) => {
                    return (
                        <div
                            key={constraint.constraint}
                            className={`aspect-square bg-secondary-background flex flex-col gap-1 items-center justify-center border cursor-pointer ${selectedContraint.getConstraint() === constraint.constraint ? "border-select-color" : "border-foreground/20"}`}
                            onClick={() => handleChangeConstraint(constraint.constraint as ATConstraint)}
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
                    const hightlight = selectedTargets.includes(ruleset.id) && selectedContraint.getConstraint() !== "EMPTY" && selectedContraint.getConstraint() !== "ANY";
                    const requiredTarget = selectedContraint.getConstraint() === "REQUIRE" || selectedContraint.getConstraint() === "NOT";
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

function CellToolTip({ rule, gridIndex, children }: { rule: ATRule, gridIndex: number, children: ReactNode }) {
    const { version } = useEditRulesetStore();

    const [open, setOpen] = useState(false);

    const contraint = useMemo(() => {
        return rule.getConstraint(gridIndex);
    }, [rule, gridIndex, version])

    const targets = useMemo(() => {
        return contraint.getTargets();
    }, [contraint, version])

    const rulesetList = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().atRulesetManager.serialize();
    }, [version])

    const contraintsIcon = useMemo(() => {
        return [
            { constraint: "EMPTY", icon: <SquareDashed /> },
            { constraint: "REQUIRE", icon: <SquareCheck /> },
            { constraint: "NOT", icon: <SquareX /> },
            { constraint: "ANY", icon: <CircleQuestionMark /> },
        ]
    }, [])

    const isEmpty = targets.length === 0 || contraint.getConstraint() === "EMPTY" || contraint.getConstraint() === "ANY";

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
                        <span>Contraint:</span>
                        <span>{contraintsIcon.find((icon) => icon.constraint === contraint.getConstraint())?.icon}</span>
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