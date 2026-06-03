import { DialogService } from "@/shared/services/dialog.service";
import { RulesetService } from "@/shared/services/ruleset.service";
import QuickToolTip from "@/ui/components/custom/QuickToolTip";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { useRulesetStore } from "@/ui/stores/ruleset.store";
import { Pen, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

export default function RulesetMenuBar() {
    const { currentSelectedRuleId } = useRulesetStore();

    const onEditRule = useCallback(() => {
        if (!currentSelectedRuleId) return;
        DialogService.openEditRulesetDialog(currentSelectedRuleId);
    }, [currentSelectedRuleId])

    const onDeleteRule = useCallback(() => {
        if (!currentSelectedRuleId) return;
        RulesetService.deleteRuleset(currentSelectedRuleId);
    }, [currentSelectedRuleId])

    return (
        <HStack className="bg-surface w-full p-1 gap-0.5">
            <QuickToolTip toolTip={"workspace.rulesetManager.menu.new"}>
                <Button variant={"ghost"} size={"icon-sm"} onClick={RulesetService.createRuleset}>
                    <Plus />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.rulesetManager.menu.edit"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!currentSelectedRuleId} onClick={onEditRule}>
                    <Pen />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.rulesetManager.menu.delete"}>
                <Button variant={"ghost"} size={"icon-sm"} className="text-destructive" disabled={!currentSelectedRuleId} onClick={onDeleteRule}>
                    <Trash2 />
                </Button>
            </QuickToolTip>
        </HStack>
    )
}