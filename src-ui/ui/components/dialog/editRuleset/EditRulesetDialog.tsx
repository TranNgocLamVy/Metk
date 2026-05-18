import { useDialogStore } from "@/ui/stores/dialog.store";
import { BaseDialogProps } from "../dialogRegistry";
import { DialogContent, Dialog, DialogTitle } from "../../shadcn/dialog";
import { useMemo } from "react";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { HStack, VStack } from "../../custom/stack/Stack";
import OutputSelector from "./OutputSelector";
import { Ruleset } from "@/editor/model/ruleset/ruleset";
import { LocalizedText } from "../../custom/LocalizeText";
import EditRulesetSidebar from "./Sidebar";
import RuleEditor from "./RuleEditor";
import { EditRulesetContext, useRulesetController } from "./ContextProvider";

interface EditRulesetDialogProps extends BaseDialogProps {
    dialogId: string;
    rulesetId: string;
}

export function EditRulesetDialog({ dialogId, rulesetId }: EditRulesetDialogProps) {
    const ruleset = useMemo(() => {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        if (!currentProject) return null;
        const rulesetManager = currentProject.rulesetManager;
        return rulesetManager.cloneRuleset(rulesetId);
    }, [rulesetId]);

    if (!ruleset) return null;

    return <EditRulesetDialogProvider clonedRuleset={ruleset} dialogId={dialogId} />
}

function EditRulesetDialogProvider({ clonedRuleset, dialogId }: { clonedRuleset: Ruleset, dialogId: string }) {
    const { closeDialog } = useDialogStore();

    const controller = useRulesetController(clonedRuleset);

    return (
        <EditRulesetContext.Provider value={controller}>
            <Dialog open onOpenChange={() => closeDialog(dialogId)}>
                <DialogContent className="w-full h-full flex flex-row p-4 bg-transparent gap-4" onInteractOutside={(e) => e.preventDefault()} showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogTitle className="hidden"><LocalizedText message="dialog.editRuleset.title" /></DialogTitle>
                    <EditRulesetSidebar dialogId={dialogId} />

                    <HStack className="flex-1 gap-4">
                        <HStack className="w-2/5 h-full p-2 gap-2 bg-surface-overlay">
                            <RuleEditor />
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