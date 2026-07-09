import { DialogService } from "@/ui/dialogs/dialog-gateway";
import * as RulesetActions from "@/application/actions/ruleset.actions";
import QuickToolTip from "@/ui/components/custom/QuickToolTip";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { useCurrentSelectedRuleId } from "@/ui/stores/ruleset.store";
import { Pen, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

export default function RulesetMenuBar() {
    const currentSelectedRuleId = useCurrentSelectedRuleId();

    const onEditRule = useCallback(() => {
        if (!currentSelectedRuleId) return;
        DialogService.openEditRulesetDialog(currentSelectedRuleId);
    }, [currentSelectedRuleId])

    const onDeleteRule = useCallback(() => {
        if (!currentSelectedRuleId) return;
        RulesetActions.deleteRulesetFile(currentSelectedRuleId);
    }, [currentSelectedRuleId])

    return (
        <HStack className="bg-surface w-full p-1 gap-0.5">
            <QuickToolTip toolTip={"workspace.rulesetManager.menu.new"}>
                <Button variant={"ghost"} size={"icon-sm"} onClick={RulesetActions.createRuleset}>
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
