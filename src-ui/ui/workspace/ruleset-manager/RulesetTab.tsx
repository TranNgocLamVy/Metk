import { DialogService } from "@/ui/dialogs/dialog-gateway";
import * as RulesetActions from "@/application/actions/ruleset.actions";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";
import { useCurrentSelectedRuleId } from "@/ui/stores/ruleset.store";
import { Ellipsis, Pen, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

export default function RulesetTab() {
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
        <HStack className="w-full h-fit bg-surface-sunken" justify="start" align="center">
            <DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant={"ghost"} size={"icon"} asChild className="p-1.5 bg-surface">
						<Ellipsis />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="bottom">
					<DropdownMenuItem onClick={RulesetActions.createRuleset}>
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
