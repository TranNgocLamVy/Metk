import { Ellipsis, Pen, Plus, Trash2 } from "lucide-react";
import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { RulesetService } from "@/shared/services/ruleset.service";
import { useCallback } from "react";
import { useRulesetStore } from "@/ui/stores/ruleset.store";
import { DialogService } from "@/shared/services/dialog.service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { LocalizedText } from "../../custom/LocalizeText";

export default function RulesetTab() {
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
        <HStack className="w-full h-fit bg-surface-sunken" justify="start" align="center">
            <DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant={"ghost"} size={"icon"} asChild className="p-1.5 bg-surface">
						<Ellipsis />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="bottom">
					<DropdownMenuItem onClick={RulesetService.createRuleset}>
						<Plus />
						<LocalizedText message="workspace.rulesetManager.dropdown.new" />
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onEditRule} disabled={!currentSelectedRuleId}>
						<Pen />
						<LocalizedText message="workspace.rulesetManager.dropdown.edit" />
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onDeleteRule} disabled={!currentSelectedRuleId}>
						<Trash2 className="text-destructive" />
						<LocalizedText message="workspace.rulesetManager.dropdown.delete" />
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
        </HStack>
    )
}