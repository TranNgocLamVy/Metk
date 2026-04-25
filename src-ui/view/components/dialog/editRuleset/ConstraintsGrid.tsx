import { HStack, VStack } from "../../custom/stack/Stack";
import { ReactNode, useMemo } from "react";
import { Rule } from "@/core/application/rule/rule";
import { CircleQuestionMark, SquareCheck, SquareX } from "lucide-react";
import { appCore } from "@/core/appcore";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";
import { useEditRuleset } from "./EditRulesetContext";
import { RuleRequirement } from "@/shared/schema/rulesetSchema";
import { LocalizedText } from "../../custom/LocalizeText";

const requirementIcons = [
    { requirement: RuleRequirement.ANY, icon: <CircleQuestionMark /> },
    { requirement: RuleRequirement.IS, icon: <SquareCheck /> },
    { requirement: RuleRequirement.NOT, icon: <SquareX /> },
]

export default function ConstraintsGrid() {
    const { ruleset, selectedRule, selectedGrid, version, setSelectedGrid, refresh } = useEditRuleset();

    const gridSize = ruleset.size;
    const middleIndex = ((gridSize * gridSize) - 1) / 2;

    const constraints = useMemo(() => {
        if (!selectedRule) return [];
        return selectedRule.getConstaints();
    }, [selectedRule, version]);

    const rulesetList = useMemo(() => {
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return [];
        return currentProject.rulesetManager.serialize();
    }, [version]);

    const onSelect = (index: number) => {
        setSelectedGrid(index);
        refresh();
    };

    return (
        <div className="w-full gap-2 grid" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
            {constraints.map((constraint, index) => {
                const firstConstraintColor = rulesetList.find((r) => constraint.getTargetIds().includes(r.id))?.color ?? null;
                const isEmpyOrAny = constraint.getRequirement() === RuleRequirement.ANY;
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
                            className={`aspect-square bg-surface-overlay-sunken relative p-2 flex items-center justify-center ${selectedGrid === index ? "ring-2 ring-accent" : "border border-foreground/20 hover:ring-2 hover:ring-accent hover:border-transparent"}`}
                        >
                            {firstConstraintColor && <div className="w-full h-full" style={{ backgroundColor: isEmpyOrAny ? "transparent" : firstConstraintColor }} />}
                            <div className="absolute">
                                {requirementIcons.find((icon) => icon.requirement === constraint.getRequirement())?.icon}
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

    const isEmpty = targets.length === 0 || constraint.getRequirement() === RuleRequirement.ANY;

    return (
        <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="w-80 min-h-fit bg-surface-overlay shadow-lg p-2">
                <VStack className="flex-1 gap-4">
                    <HStack align="center" justify="center" className="h-fit w-fit gap-2">
                        <span><LocalizedText message="dialog.editRuleset.requirement" />:</span>
                        <span>{requirementIcons.find((icon) => icon.requirement === constraint.getRequirement())?.icon}</span>
                    </HStack>
                    <VStack className="gap-2">
                        <HStack className="gap-2">
                            <span><LocalizedText message="dialog.editRuleset.targets" />:</span>
                            {isEmpty && <span><LocalizedText message="dialog.editRuleset.none" /></span>}
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