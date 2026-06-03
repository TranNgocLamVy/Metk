import { appKernel } from "@/application/bootstrap/app-kernel";
import { Ruleset } from "@/editor/model/ruleset/ruleset";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { BaseDialogProps } from "@/ui/components/dialog/dialogRegistry";
import { Dialog, DialogContent, DialogTitle } from "@/ui/components/shadcn/dialog";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { useMemo } from "react";
import { EditRulesetContext, useRulesetController } from "./ContextProvider";
import OutputSelector from "./OutputSelector";
import RuleEditor from "./RuleEditor";
import EditRulesetSidebar from "./Sidebar";

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
                        <HStack className="w-2/5 h-full p-2 gap-2 bg-surface">
                            <RuleEditor />
                        </HStack>

                        <VStack className="w-3/5 h-full p-2 bg-surface">
                            <OutputSelector />
                        </VStack>
                    </HStack>
                </DialogContent>
            </Dialog>
        </EditRulesetContext.Provider>
    );
}
