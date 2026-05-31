import { useRulesetStore } from "@/ui/stores/ruleset.store";
import { HStack, VStack } from "../../custom/stack/Stack";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../shadcn/context-menu";
import { ScrollArea, ScrollBar } from "../../shadcn/scroll-area";
import { useCallback, useEffect } from "react";
import ContextMenuItemGroup from "../../context-menu/ContextMenuItemGroup";
import { RulesetManagerContextMenu } from "./ContextMenu";
import { WorkspaceService } from "@/shared/services/workspace.service";
import { useRulesetManagerEvent } from "@/ui/hooks/useRulesetManagerEvent.hook";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";
import { useProjectStore } from "@/ui/stores/project.store";
import RulesetTab from "./RulesetTab";

export default function RulesetManager() {
    const { activeWorkspace } = useWorkspaceStore();
    const { activeProject } = useProjectStore();

    const { rulesetDisplayDatas, currentSelectedRuleId, setCurrentSelectedRuleId, setRulesetDisplayData } = useRulesetStore();

    useEffect(() => {
        if (!activeWorkspace || !activeProject) return;

        const selectedRuleset = activeWorkspace.rulesetSessionManager.getSelectedRuleId();
        setCurrentSelectedRuleId(selectedRuleset);
        setRulesetDisplayData(activeProject.rulesetManager.serialize().map(ruleset => ({ id: ruleset.id, name: ruleset.name, color: ruleset.color })))

        return () => {
            setCurrentSelectedRuleId(null);
            setRulesetDisplayData([]);
        }
    }, [activeWorkspace])

    useRulesetManagerEvent("onRulesetManagerUpdated", (rulesets) => {
        setRulesetDisplayData(rulesets.map(ruleset => ({ id: ruleset.id, name: ruleset.name, color: ruleset.color })))
    })

    const onSelectRule = useCallback((rulesetId: string) => {
        if (currentSelectedRuleId === rulesetId) {
            WorkspaceService.selectRuleset(null);
            setCurrentSelectedRuleId(null);
        } else {
            WorkspaceService.selectRuleset(rulesetId);
            setCurrentSelectedRuleId(rulesetId);
        }
    }, [currentSelectedRuleId]);

    return (
        <VStack className="w-full h-full relative overflow-hidden bg-surface">
            <VStack className="absolute inset w-full h-full px-1 py-2 bg-surface">
                <RulesetTab />
                <div className="w-full h-2 bg-surface" />
                <ContextMenu>
                    <ContextMenuTrigger className="w-full h-full">
                        <ScrollArea className="w-full h-full no-scrollbar bg-surface-base rounded-lg shadow-sm">
                            <div className="flex flex-col w-full min-h-full pb-10">
                                {rulesetDisplayDatas.map((ruleset) => {
                                    const isSelected = currentSelectedRuleId === ruleset.id;
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
        </VStack>

    )
}