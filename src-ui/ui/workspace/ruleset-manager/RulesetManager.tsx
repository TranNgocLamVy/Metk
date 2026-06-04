import * as WorkspaceActions from "@/application/actions/workspace.actions";
import ContextMenuItemGroup from "@/ui/components/context-menu/ContextMenuItemGroup";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import PanelContainer from "@/ui/components/layout/PanelContainer";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/ui/components/shadcn/context-menu";
import { ScrollArea, ScrollBar } from "@/ui/components/shadcn/scroll-area";
import { useRulesetManagerEvent } from "@/ui/hooks/useRulesetManagerEvent.hook";
import { useProjectStore } from "@/ui/stores/project.store";
import { useRulesetStore } from "@/ui/stores/ruleset.store";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";
import { useCallback, useEffect } from "react";
import { RulesetManagerContextMenu } from "./ContextMenu";
import RulesetMenuBar from "./RulesetMenubar";

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
            WorkspaceActions.selectRuleset(null);
            setCurrentSelectedRuleId(null);
        } else {
            WorkspaceActions.selectRuleset(rulesetId);
            setCurrentSelectedRuleId(rulesetId);
        }
    }, [currentSelectedRuleId]);

    return (
        <PanelContainer className="ruleset-manager">
            <VStack className="w-full h-full px-frame-quarter pb-frame-half bg-surface">
                <RulesetMenuBar />
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        <ScrollArea className="w-full h-full min-h-0 no-scrollbar bg-surface-base rounded-md inset-shadow-panel border-t border-foreground/30">
                            <div className="flex flex-col w-full h-full">
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
                            <ScrollBar className="w-2" />
                        </ScrollArea>
                    </ContextMenuTrigger>
                    <ContextMenuContent className={RulesetManagerContextMenu.className}>
                        <ContextMenuItemGroup groups={RulesetManagerContextMenu.groups} />
                    </ContextMenuContent>
                </ContextMenu>
            </VStack>
        </PanelContainer>
    )
}