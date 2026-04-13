import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { HStack, VStack } from "../../custom/stack/Stack";
import { useMemo, useState } from "react";
import { ATRule } from "@/core/application/atrule/atRule";
import { ArrowRight, CircleQuestionMark, SquareCheck, SquareDashed, SquareX } from "lucide-react";
import { AppCore } from "@/core/appcore";
import { ATConstraint } from "@/shared/schema/atRuleSchema";
import OutputList from "./OutputList";

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
    const { version, session } = useEditRulesetStore();

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

    const middleIndex = ((gridSize * gridSize) - 1) / 2;

    return (
        <div className={`w-full gap-2 grid`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }} >
            {contraints.map((contraint, index) => {
                const firstContraintColor = rulesetList.find((ruleset) => contraint.getTargets().includes(ruleset.id))?.color ?? null;
                const isEmpyOrAny = contraint.getConstraint() === "EMPTY" || contraint.getConstraint() === "ANY";

                if (index === middleIndex) {
                    return (
                        <div key={index} className={`aspect-square bg-secondary-background border cursor-not-allowed`} >
                            
                        </div>
                    )
                }

                return (
                    <div key={index} onClick={() => setSelectedGrid(index)}
                        className={`aspect-square bg-secondary-background relative p-2 flex items-center justify-center border ${selectedGrid === index ? "border-select-color" : "border-foreground/20"}`}
                    >
                        {firstContraintColor && <div className="w-full h-full" style={{ backgroundColor: isEmpyOrAny ? "transparent" : firstContraintColor }} />}
                        <div className="absolute">
                            {contraintsIcon.find((icon) => icon.constraint === contraint.getConstraint())?.icon}
                        </div>
                    </div>
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
                    return (
                        <div
                            key={ruleset.id}
                            className={`aspect-square bg-secondary-background flex flex-col p-2 gap-2 items-center justify-center border ${selectedTargets.includes(ruleset.id) ? "border-select-color" : "border-foreground/20"}`}
                            onClick={() => handleSelectTarget(ruleset.id)}
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