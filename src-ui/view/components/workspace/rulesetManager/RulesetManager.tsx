import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import { HStack, VStack } from "../../custom/stack/Stack";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../shadcn/context-menu";
import { ScrollArea, ScrollBar } from "../../shadcn/scroll-area";
import { MouseEvent, useCallback, useMemo } from "react";
import ContextMenuItemGroup from "../../contextMenu/ContextMenuItemGroup";
import { RulesetManagerContextMenu } from "./ContextMenu";
import { Button } from "../../shadcn/button";
import { Pen, Trash } from "lucide-react";
import { RulesetService } from "@/shared/services/rulesetService";
import { DialogService } from "@/shared/services/dialogService";
import { WorkspaceService } from "@/shared/services/workspaceService";



export default function RulesetManager() {
    const { version, getRulesetDisplayData, getCurrentSelectedRuleId } = useRulesetManagerStore();

    const rulesets = useMemo(() => {
        return getRulesetDisplayData();
    }, [version]);

    const selectedRuleId = useMemo(() => {
        return getCurrentSelectedRuleId();
    }, [version]);

    const onSelectRule = useCallback((rulesetId: string) => {
        if (selectedRuleId === rulesetId) {
            WorkspaceService.selectRuleset(null);
        } else {
            WorkspaceService.selectRuleset(rulesetId);
        }
    }, [selectedRuleId]);

    const onEditRule = useCallback((e: MouseEvent<HTMLButtonElement>, rulesetId: string) => {
        e.stopPropagation();
        DialogService.openEditRulesetDialog(rulesetId);
    }, [])

    const onDeleteRule = useCallback((e: MouseEvent<HTMLButtonElement>, rulesetId: string) => {
        e.stopPropagation();
        RulesetService.deleteRuleset(rulesetId);
    }, [])

    return (
        <VStack className="w-full h-full px-1 py-2 bg-surface">
            <ContextMenu>
                <ContextMenuTrigger className="w-full h-full">
                    <ScrollArea className="w-full h-full no-scrollbar bg-surface-overlay-raised rounded-lg shadow-sm">
                        <div className="flex flex-col w-full min-h-full pb-10">
                            {rulesets.map((ruleset) => (
                                <HStack onClick={() => onSelectRule(ruleset.id)} key={ruleset.id}
                                    className={`flex items-center justify-center gap-2 p-2 ${selectedRuleId === ruleset.id ? "bg-accent/50" : "hover:bg-accent/20"}`}
                                >
                                    <div className="w-8 h-8" style={{ backgroundColor: ruleset.color ?? "#fff" }} />
                                    <div className="text-xs text-foreground flex items-center">{ruleset.name}</div>
                                    <Button className="ml-auto" size={"icon"} variant={"ghost"} onClick={(e) => onEditRule(e, ruleset.id)}>
                                        <Pen />
                                    </Button>
                                    <Button size={"icon"} variant={"destructive"} onClick={(e) => onDeleteRule(e, ruleset.id)}>
                                        <Trash />
                                    </Button>
                                </HStack>
                            ))}
                        </div>
                        <div className="flex-1 min-h-[10px] h-full transition-colors" />
                        <ScrollBar className="w-2" />
                    </ScrollArea>
                </ContextMenuTrigger>
                <ContextMenuContent className={RulesetManagerContextMenu.className}>
                    <ContextMenuItemGroup groups={RulesetManagerContextMenu.groups} />
                </ContextMenuContent>
            </ContextMenu>
        </VStack>
    )
}