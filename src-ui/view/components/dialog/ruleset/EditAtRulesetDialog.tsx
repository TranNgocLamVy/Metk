import { useDialogStore } from "@/view/stores/dialogStore";
import { BaseDialogProps } from "../dialogRegistry";
import { DialogContent, Dialog, DialogClose, DialogTitle } from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { useEffect} from "react";
import { AppCore } from "@/core/appcore";
import { HStack, VStack } from "../../custom/stack/Stack";
import RuleList from "./RuleList";
import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import RuleEditor from "./RuleEditor";
import RuleHeader from "./RuleHeader";
import { VisuallyHidden } from "radix-ui";

interface EditAtRulesetDialogProps extends BaseDialogProps {
    dialogId: string;
    rulesetId: string;
}

export function EditAtRulesetDialog({ dialogId, rulesetId }: EditAtRulesetDialogProps) {
    const { closeDialog } = useDialogStore();

    const { ruleset, setRuleset } = useEditRulesetStore();

    useEffect(() => {
        const atRulesetManager = AppCore.getIns().editorContext.getCurrentProject().atRulesetManager;
        const ruleset = atRulesetManager.cloneAtRuleset(rulesetId);
        if (!ruleset) closeDialog(dialogId);
        setRuleset(ruleset!);

        return () => {
            setRuleset(null!);
        }
    }, [rulesetId])

    const handleSave = () => {
        console.log(ruleset?.serialize());
    }

    if (!ruleset) return null;
    return (
        <Dialog open onOpenChange={() => closeDialog(dialogId)}>
            <DialogContent
                className="w-full h-full flex flex-row p-4 bg-transparent gap-4"
                onInteractOutside={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                <DialogTitle className="hidden">Ruleset Editor</DialogTitle>
                <VStack className="w-1/4 h-full bg-background p-4 rounded-md gap-4">
                    <RuleHeader />
                    <RuleList />
                    <HStack className="w-full h-fit gap-4">
                        <DialogClose asChild>
                            <Button variant="outline" type="button" onClick={() => closeDialog(dialogId)} className="ml-auto">Discard change</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSave}>Save</Button>
                    </HStack>
                </VStack>

                <VStack className="flex-1 p-4 gap-4 bg-background">
                    <RuleEditor />
                </VStack>
            </DialogContent>
        </Dialog>
    );
}

