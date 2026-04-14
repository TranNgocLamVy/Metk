import { useDialogStore } from "@/view/stores/dialogStore";
import { BaseDialogProps } from "../dialogRegistry";
import { DialogContent, Dialog, DialogClose, DialogTitle } from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { useEffect } from "react";
import { AppCore } from "@/core/appcore";
import { HStack, VStack } from "../../custom/stack/Stack";
import RuleList from "./RuleList";
import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import RuleEditor from "./RuleEditor";
import RuleHeader from "./RuleHeader";
import { RulesetSession } from "@/core/application/session/rulesetSession";
import { ToastService } from "@/shared/services/toastService";
import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import OutputSelector from "./OutputSelector";

interface EditRulesetDialogProps extends BaseDialogProps {
    dialogId: string;
    rulesetId: string;
}

export function EditRulesetDialog({ dialogId, rulesetId }: EditRulesetDialogProps) {
    const { closeDialog } = useDialogStore();

    const { session, setSession } = useEditRulesetStore();

    useEffect(() => {
        const editorContext = AppCore.getIns().editorContext;
        const rulesetManager = editorContext.getCurrentProject().rulesetManager;

        const clonedRuleset = rulesetManager.cloneRuleset(rulesetId);

        if (!clonedRuleset) {
            closeDialog(dialogId);
            return;
        }

        const newSession = new RulesetSession(clonedRuleset, editorContext);
        setSession(newSession);

        // TODO: Enable this after implement edit ruleset
        // return () => {
        //     newSession.destroy();
        //     setSession(null!);
        // };
    }, [rulesetId]);

    const handleSave = async () => {
        if (!session) return;
        const editorContext = AppCore.getIns().editorContext;
        const rulesetManager = editorContext.getCurrentProject().rulesetManager;
        rulesetManager.updateRuleset(session.ruleset.serialize());
        await rulesetManager.saveRuleset(session.ruleset.id);
        useRulesetManagerStore.getState().refresh();
        ToastService.success({ message: "Ruleset saved successfully" });
        onClose();
    }

    const onClose = () => {
        closeDialog(dialogId);
        if (session) {
            session.destroy();
            setSession(null!);
        }
    }

    if (!session) return null;
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent
                className="w-full h-full flex flex-row p-4 bg-transparent gap-4"
                onInteractOutside={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                <DialogTitle className="hidden">Ruleset Editor</DialogTitle>
                <VStack className="w-fit h-full bg-background p-4 rounded-md gap-4">
                    <RuleHeader />
                    <RuleList />
                    <HStack className="w-full h-fit gap-4">
                        <DialogClose asChild>
                            <Button variant="outline" type="button" onClick={() => closeDialog(dialogId)} className="ml-auto">Discard change</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSave}>Save</Button>
                    </HStack>
                </VStack>

                <HStack className="flex-1 gap-4">
                    <VStack className="w-2/5 h-full p-4 gap-4 bg-background">
                        <RuleEditor />
                    </VStack>

                    <VStack className="w-3/5 h-full p-4 gap-4 bg-background">
                        <OutputSelector />
                    </VStack>
                </HStack>
            </DialogContent>
        </Dialog>
    );
}

