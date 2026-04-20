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
import RulesetMenuBar from "./RulesetMenuBar";



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

    return (
        <VStack className="w-full h-full relative overflow-hidden bg-surface">
            <VStack className="absolute inset w-full h-full px-1 py-2 bg-surface">
                <ContextMenu>
                    <ContextMenuTrigger className="w-full h-full">
                        <ScrollArea className="w-full h-full no-scrollbar bg-surface-base rounded-lg shadow-sm">
                            <div className="flex flex-col w-full min-h-full pb-10">
                                {rulesets.map((ruleset) => {
                                    const isSelected = selectedRuleId === ruleset.id;
                                    return (
                                        <HStack onClick={() => onSelectRule(ruleset.id)} key={ruleset.id}
                                            className={`flex items-center justify-center gap-2 p-2 ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                                        >
                                            <div className="size-6 aspect-square" style={{ backgroundColor: ruleset.color ?? "#fff" }} />
                                            <div className={`text-xs flex items-center ${isSelected ? "text-accent-foreground" : ""}`}>{ruleset.name}</div>
                                        </HStack>
                                    )
                                })}
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
            <RulesetMenuBar />
        </VStack>

    )
}