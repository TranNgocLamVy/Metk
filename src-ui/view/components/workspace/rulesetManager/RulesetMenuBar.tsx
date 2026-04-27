import { Pen, Plus, Trash2 } from "lucide-react";
import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import QuickToolTip from "../../custom/QuickToolTip";
import { RulesetService } from "@/shared/services/rulesetService";
import { useCallback, useMemo } from "react";
import { useRulesetStore } from "@/view/stores/rulesetStore";
import { DialogService } from "@/shared/services/dialogService";

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
        <HStack className="bg-surface absolute bottom-1 w-full px-1 py-1 gap-0.5">
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