import { useDialogStore } from "@/view/stores/dialogStore";
import { BaseDialogProps } from "../dialogRegistry";
import { DialogContent, Dialog, DialogClose, DialogTitle } from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { useEffect, useMemo, useState, useCallback, WheelEvent } from "react";
import { appCore } from "@/core/appcore";
import { HStack, VStack } from "../../custom/stack/Stack";
import RuleList from "./RuleList";
import RuleHeader from "./RuleHeader";
import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import OutputSelector from "./OutputSelector";
import ConstraintsGrid from "./ConstraintsGrid";
import { ArrowRight } from "lucide-react";
import ConstraintTargetEditor from "./ConstraintTargetEditor";
import OutputList from "./OutputList";
import { Ruleset } from "@/core/application/rule/ruleset";
import { EditRulesetContext } from "./EditRulesetContext";
import { LocalizedText } from "../../custom/LocalizeText";

interface EditRulesetDialogProps extends BaseDialogProps {
    dialogId: string;
    rulesetId: string;
}

export function EditRulesetDialog({ dialogId, rulesetId }: EditRulesetDialogProps) {

    const { closeDialog } = useDialogStore();

    const [version, setVersion] = useState(0);
    const [ruleset, setRuleset] = useState<Ruleset | null>(null);
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [selectedGrid, setSelectedGrid] = useState<number>(0);

    const selectedRule = useMemo(() => {
        if (!ruleset || !selectedRuleId) return null;
        return ruleset.getRule(selectedRuleId);
    }, [ruleset, selectedRuleId]);

    const refresh = useCallback(() => {
        setVersion(v => v + 1);
    }, []);

    useEffect(() => {
        const editorContext = appCore.editorContext;
        const currentProject = editorContext.currentProject;
        if (!currentProject) return;

        const rulesetManager = currentProject.rulesetManager;
        const clonedRuleset = rulesetManager.cloneRuleset(rulesetId);

        if (!clonedRuleset) {
            closeDialog(dialogId);
            return;
        }
        setRuleset(clonedRuleset);
    }, [rulesetId, closeDialog, dialogId]);

    const onWheel = (e: WheelEvent<HTMLDivElement>) => {
        if (!ruleset) return;
        const inc = e.deltaY > 0 ? 1 : -1;
        const totalCells = ruleset.size * ruleset.size;
        const maxIndex = totalCells - 1;
        const middleIndex = Math.floor(totalCells / 2);
        let newIndex = selectedGrid + inc;
        if (newIndex < 0) newIndex = maxIndex;
        if (newIndex > maxIndex) newIndex = 0;
        if (newIndex === middleIndex) {
            newIndex += inc;
            if (newIndex < 0) newIndex = maxIndex;
            if (newIndex > maxIndex) newIndex = 0;
        }
        setSelectedGrid(newIndex);
        refresh();
    }

    const handleSave = async () => {
        if (!ruleset) return;
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return;

        const rulesetManager = currentProject.rulesetManager;
        rulesetManager.updateRuleset(ruleset.serialize());
        await rulesetManager.saveRuleset(ruleset.id);
        useRulesetManagerStore.getState().refresh();

        onClose();
    };

    const onClose = () => {
        closeDialog(dialogId);
        setRuleset(null);
    };

    if (!ruleset) return null;

    return (
        <EditRulesetContext.Provider value={{
            ruleset,
            selectedRule,
            selectedRuleId,
            setSelectedRuleId,
            selectedGrid,
            setSelectedGrid,
            version,
            refresh
        }}>
            <Dialog open onOpenChange={onClose}>
                <DialogContent
                    className="w-full h-full flex flex-row p-4 bg-transparent gap-4"
                    onInteractOutside={(e) => e.preventDefault()}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    showCloseButton={false}
                >
                    <DialogTitle className="hidden"><LocalizedText message="dialog.editRuleset.title" /></DialogTitle>
                    <VStack className="w-fit h-full bg-surface-overlay p-2 gap-2">
                        <RuleHeader />
                        <RuleList />
                        <HStack className="w-full h-fit gap-2">
                            <DialogClose asChild>
                                <Button variant="outline" type="button" onClick={() => closeDialog(dialogId)} className="ml-auto"><LocalizedText message="dialog.editRuleset.action.discard" /></Button>
                            </DialogClose>
                            <Button type="button" onClick={handleSave}><LocalizedText message="dialog.editRuleset.action.save" /></Button>
                        </HStack>
                    </VStack>

                    <HStack className="flex-1 gap-4">
                        <HStack onWheel={onWheel} className="w-2/5 h-full p-2 gap-2 bg-surface-overlay">
                            <VStack className="w-full h-full gap-8 p-2 bg-surface-base">
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
                                <ConstraintTargetEditor />
                            </VStack>
                        </HStack>

                        <VStack className="w-3/5 h-full p-2 bg-surface-overlay">
                            <OutputSelector />
                        </VStack>
                    </HStack>
                </DialogContent>
            </Dialog>
        </EditRulesetContext.Provider>
    );
}