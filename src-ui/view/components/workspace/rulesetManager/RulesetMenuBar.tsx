import { Pen, Plus, Trash2 } from "lucide-react";
import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import QuickToolTip from "../../custom/QuickToolTip";
import { RulesetService } from "@/shared/services/rulesetService";
import { useCallback, useMemo } from "react";
import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import { DialogService } from "@/shared/services/dialogService";

export default function RulesetMenuBar() {
    const { version, getCurrentSelectedRuleId } = useRulesetManagerStore();

    const selectedRuleId = useMemo(() => {
        return getCurrentSelectedRuleId();
    }, [version]);

    const onEditRule = useCallback(() => {
        if (!selectedRuleId) return;
        DialogService.openEditRulesetDialog(selectedRuleId);
    }, [selectedRuleId])

    const onDeleteRule = useCallback(() => {
        if (!selectedRuleId) return;
        RulesetService.deleteRuleset(selectedRuleId);
    }, [selectedRuleId])

    return (
        <HStack className="bg-surface absolute bottom-1 w-full px-1 py-1 gap-0.5">
            <QuickToolTip toolTip="Create Ruleset">
                <Button variant={"ghost"} size={"icon-sm"} onClick={RulesetService.createRuleset}>
                    <Plus />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip="Edit Ruleset">
                <Button variant={"ghost"} size={"icon-sm"} disabled={!selectedRuleId} onClick={onEditRule}>
                    <Pen />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip="Delete Ruleset">
                <Button variant={"ghost"} size={"icon-sm"} className="text-destructive" disabled={!selectedRuleId} onClick={onDeleteRule}>
                    <Trash2 />
                </Button>
            </QuickToolTip>
        </HStack>
    )
}