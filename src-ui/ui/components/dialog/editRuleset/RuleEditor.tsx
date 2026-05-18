import { RuleRequirement } from "@/shared/schema/ruleset.schema";
import { ArrowRight, Check, CircleQuestionMark, SquareCheck, SquareDashed, SquareX } from "lucide-react";
import PixiImage from "../../custom/PixiImage";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { VStack } from "../../custom/stack/Stack";
import { useCallback, WheelEvent } from "react";
import { ScrollArea } from "../../shadcn/scroll-area";
import { LocalizedText } from "../../custom/LocalizeText";
import { useEditRuleset } from "./ContextProvider";


export default function RuleEditor() {
    const { ruleset, selectedRule, selectedConstraintIndex, setSelectedConstraintIndex } = useEditRuleset();

    const onWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
        if (!ruleset) return;
        const inc = e.deltaY > 0 ? 1 : -1;
        const totalCells = ruleset.size * ruleset.size;
        const maxIndex = totalCells - 1;
        const middleIndex = Math.floor(totalCells / 2);
        let newIndex = selectedConstraintIndex + inc;
        if (newIndex < 0) newIndex = maxIndex;
        if (newIndex > maxIndex) newIndex = 0;
        if (newIndex === middleIndex) {
            newIndex += inc;
            if (newIndex < 0) newIndex = maxIndex;
            if (newIndex > maxIndex) newIndex = 0;
        }
        setSelectedConstraintIndex(newIndex);
    }, [selectedConstraintIndex, setSelectedConstraintIndex, ruleset]);

    return (
        <VStack onWheel={onWheel} className="w-full h-full gap-8 p-2 bg-surface-base">
            <div className="w-full aspect-[7/5] grid grid-cols-7">
                <div className="col-span-5">
                    <ConstraintsGrid />
                </div>

                <div className="col-span-1 flex items-center justify-center">
                    {selectedRule && <ArrowRight />}
                </div>

                <div onWheel={(e) => e.stopPropagation()} className="col-span-1 relative h-full">
                    {selectedRule && <div className="absolute inset-0">
                        <OutputList />
                    </div>}
                </div>
            </div>
            <RequirementEditor />
        </VStack>

    )
}

function ConstraintsGrid() {
    const { rulesetList, ruleset, constraintList, selectedConstraintIndex, ruleOutputs, setSelectedConstraintIndex } = useEditRuleset();

    const gridSize = ruleset.size;
    const middleIndex = ((gridSize * gridSize) - 1) / 2;

    const requirementIcons = [
        { requirement: RuleRequirement.EMPTY, icon: <SquareDashed /> },
        { requirement: RuleRequirement.IS, icon: <SquareCheck size={32} className="text-green-500 p-1 bg-black/20" /> },
        { requirement: RuleRequirement.NOT, icon: <SquareX size={32} className="text-red-500 p-1 bg-black/20" /> },
    ]

    return (
        <div className="w-full gap-2 grid" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
            {constraintList.map((constraint, index) => {
                const firstConstraintColor = rulesetList.find((r) => constraint.getTargetIds().includes(r.id))?.color ?? null;
                const isEmpyOrAny = constraint.getRequirement() === RuleRequirement.ANY;
                const currentRulesetColor = ruleset.color;
                const isSelected = selectedConstraintIndex === index;
                if (index === middleIndex) {
                    const firstOutput = ruleOutputs[0];
                    if (!firstOutput) {
                        return (
                            <div key={index} className="aspect-square bg-surface-overlay relative p-2 flex items-center justify-center cursor-not-allowed">
                                <div className="w-full h-full" style={{ backgroundColor: currentRulesetColor }} />
                            </div>
                        );
                    }
                    const tilesetId = ruleset.tilesetRefManager.getTilesetRefId(firstOutput.tilesetIndex);
                    if (!tilesetId) {
                        return (
                            <div key={index} className="aspect-square bg-surface-overlay relative p-2 flex items-center justify-center cursor-not-allowed">
                                <div className="w-full h-full" style={{ backgroundColor: currentRulesetColor }} />
                            </div>
                        );
                    }
                    const textureManager = appKernel.editorFacade.textureManager;
                    const tilesetTexture = textureManager.getTileTexture(tilesetId, firstOutput.tileId);
                    return (
                        <div key={index} className="aspect-square bg-surface-overlay relative p-2 flex items-center justify-center cursor-not-allowed">
                            <PixiImage texture={tilesetTexture} />
                        </div>
                    );
                }

                return (
                    <div key={index} onClick={() => setSelectedConstraintIndex(index)} className={`aspect-square bg-surface-overlay-sunken relative p-2 flex items-center justify-center ${isSelected ? "ring-2 ring-accent" : "border border-foreground/20 hover:ring-2 hover:ring-accent/50 hover:border-transparent"}`}
                    >
                        {firstConstraintColor && <div className="w-full h-full" style={{ backgroundColor: isEmpyOrAny ? "transparent" : firstConstraintColor }} />}
                        <div className="absolute">
                            {requirementIcons.find((icon) => icon.requirement === constraint.getRequirement())?.icon}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function OutputList() {
    const { ruleset, ruleOutputs } = useEditRuleset();

    return (
        <ScrollArea className='h-full w-full border border-foreground/20 bg-surface-overlay-sunken'>
            <div className="flex flex-wrap gap-2 p-2 w-full">
                {ruleOutputs.map((output) => {
                    const tilesetId = ruleset.tilesetRefManager.getTilesetRefId(output.tilesetIndex);
                    if (!tilesetId) return null;
                    const textureManager = appKernel.editorFacade.textureManager;
                    const tilesetTexture = textureManager.getTileTexture(tilesetId, output.tileId);
                    return (
                        <div key={`${tilesetId}-${output.tileId}`} className='w-full aspect-square border border-foreground/20'>
                            <PixiImage texture={tilesetTexture} />
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}

function RequirementEditor() {
    const { rulesetList, selectedRule, selectedConstraint, allowEmpty, constraintTargets, actions } = useEditRuleset();

    if (!selectedRule || !selectedConstraint) {
        return <div className="flex-1" />;
    }

    const requirementList = [
        { requirement: RuleRequirement.ANY, name: "ANY", icon: <CircleQuestionMark /> },
        { requirement: RuleRequirement.EMPTY, name: "EMPTY", icon: <SquareDashed /> },
        { requirement: RuleRequirement.IS, name: "IS", icon: <SquareCheck /> },
        { requirement: RuleRequirement.NOT, name: "NOT", icon: <SquareX /> },
    ]

    const needTarget = selectedConstraint.getRequirement() === RuleRequirement.IS || selectedConstraint.getRequirement() === RuleRequirement.NOT;

    return (
        <VStack className="flex-1 gap-6">
            <VStack className="gap-2">
                <span className="text-base"><LocalizedText message="dialog.editRuleset.requirement" /></span>
                <div className="w-full gap-2 grid grid-cols-7">
                    {requirementList.map((requirement) => {
                        const selected = selectedConstraint.getRequirement() === requirement.requirement;
                        return (
                            <div
                                key={requirement.requirement}
                                className={`aspect-square bg-surface-overlay-sunken flex flex-col gap-1 items-center justify-center border border-foreground/20 cursor-pointer ${selected && "outline-2 outline-accent"}`}
                                onClick={() => actions.updateConstraint(requirement.requirement)}
                            >
                                {requirement.icon}
                                <span className="text-xs">{requirement.name}</span>
                            </div>
                        )
                    })}
                </div>
            </VStack>

            <VStack className="gap-2">
                <span className="text-base"><LocalizedText message="dialog.editRuleset.targets" /></span>
                <div className="grid grid-cols-7 w-full gap-2">
                    <div onClick={() => { if (needTarget) actions.toggleAllowEmpty() }} className={`bg-surface-overlay-sunken flex flex-col cursor-pointer p-2 gap-2 items-center justify-center border border-foreground/20 ${allowEmpty && "outline-2 outline-accent"}`} >
                        <div className="size-8 aspect-square relative flex items-center justify-center border-2 border-foreground border-dashed">
                            {allowEmpty && (
                                <div className="absolute">
                                    <Check size={24} className="text-green-500 p-1 bg-black/10" strokeWidth={4} />
                                </div>
                            )}
                        </div>
                        <span className="text-[8px]">
                            <LocalizedText message="dialog.editRuleset.empty" />
                        </span>
                    </div>
                    {rulesetList.map((ruleset) => {
                        const selected = constraintTargets.includes(ruleset.id) && selectedConstraint.getRequirement() !== RuleRequirement.ANY;
                        return (
                            <div key={ruleset.id} onClick={() => { if (needTarget) actions.toggleTarget(ruleset.id) }}
                                className={`bg-surface-overlay-sunken flex flex-col cursor-pointer p-2 gap-2 items-center justify-center border border-foreground/20 ${selected && "outline-2 outline-accent"}`}
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