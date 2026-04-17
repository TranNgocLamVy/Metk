import { useDialogStore } from "@/view/stores/dialogStore";
import { BaseDialogProps } from "../dialogRegistry";
import { DialogContent, Dialog, DialogClose, DialogTitle } from "../../shadcn/dialog";
import { Button } from "../../shadcn/button";
import { useEffect, useMemo, useState } from "react";
import { AppCore } from "@/core/appcore";
import { HStack, VStack } from "../../custom/stack/Stack";
import RuleList from "./RuleList";
import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import RuleHeader from "./RuleHeader";
import { RulesetSession } from "@/core/application/session/rulesetSession";
import { ToastService } from "@/shared/services/toastService";
import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import OutputSelector from "./OutputSelector";
import ConstraintsGrid from "./ConstraintsGrid";
import { ArrowRight } from "lucide-react";
import OutputList from "./OutputList";
import ConstraintTargetEditor from "./ConstraintTargetEditor";

interface EditRulesetDialogProps extends BaseDialogProps {
    dialogId: string;
    rulesetId: string;
}

export function EditRulesetDialog({ dialogId, rulesetId }: EditRulesetDialogProps) {
    const { closeDialog } = useDialogStore();

    const { session, version, setSession } = useEditRulesetStore();

    const [selectedGrid, setSelectedGrid] = useState<number>(0);
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

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

    const rule = useMemo(() => {
        if (!session) return null;
        return session.getSelectedRule();
    }, [session, version]);

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
                <VStack className="w-fit h-full bg-surface-overlay p-2 gap-2">
                    <RuleHeader />
                    <RuleList />
                    <HStack className="w-full h-fit gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" type="button" onClick={() => closeDialog(dialogId)} className="ml-auto">Discard change</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSave}>Save</Button>
                    </HStack>
                </VStack>

                <HStack className="flex-1 gap-4">
                    <HStack className="w-2/5 h-full p-2 gap-2 bg-surface-overlay">
                            <VStack className="h-full gap-8">
                                <div className="w-full aspect-[7/5] grid grid-cols-7">
                                    <div className="col-span-5">
                                        <ConstraintsGrid selectedGrid={selectedGrid} setSelectedGrid={setSelectedGrid} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
                                    </div>

                                    <div className="col-span-1 flex items-center justify-center">
                                        {rule && <ArrowRight />}
                                    </div>

                                    <div className="col-span-1 relative h-full">
                                        {rule && <div className="absolute inset-0">
                                            <OutputList />
                                        </div>}
                                    </div>
                                </div>
                                <ConstraintTargetEditor selectedGrid={selectedGrid} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
                            </VStack>
                        </HStack>

                    <VStack className="w-3/5 h-full p-2 bg-surface-overlay">
                        <OutputSelector />
                    </VStack>
                </HStack>
            </DialogContent>
        </Dialog>
    );
}

