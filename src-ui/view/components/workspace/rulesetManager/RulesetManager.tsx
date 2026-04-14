import { useRulesetManagerStore } from "@/view/stores/rulesetManagerStore";
import { HStack, VStack } from "../../custom/stack/Stack";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../shadcn/context-menu";
import { ScrollArea, ScrollBar } from "../../shadcn/scroll-area";
import { useMemo } from "react";
import ContextMenuItemGroup from "../../contextMenu/ContextMenuItemGroup";
import { RulesetManagerContextMenu } from "./ContextMenu";
import { Button } from "../../shadcn/button";
import { Pen, Trash } from "lucide-react";
import { RulesetService } from "@/shared/services/rulesetService";
import { useDialogStore } from "@/view/stores/dialogStore";
import { DialogService } from "@/shared/services/dialogService";



export default function RulesetManager() {
    const { version, getRulesetDisplayData } = useRulesetManagerStore();

    const rulesets = useMemo(() => {
        return getRulesetDisplayData();
    }, [version]);

    return (
        <VStack className="w-full h-full rounded-md no-scrollbar">
            <ContextMenu>
                <ContextMenuTrigger className="w-full h-full no-scrollbar pt-1 bg-secondary-background">
                    <ScrollArea className="w-full h-full no-scrollbar bg-background rounded-lg border-2 shadow-sm">
                        <div className="flex flex-col w-full min-h-full pb-10">
                            {rulesets.map((ruleset) => (
                                <HStack key={ruleset.id} className="flex items-center justify-center gap-2 p-2 hover:bg-secondary-background">
                                    <div className="w-8 h-8" style={{ backgroundColor: ruleset.color ?? "#fff" }} />
                                    <div className="text-xs font-bold text-white flex items-center">{ruleset.name}</div>
                                    <Button className="ml-auto hover:bg-background" size={"icon"} variant={"ghost"} onClick={() => DialogService.openEditRulesetDialog(ruleset.id)}>
                                        <Pen />
                                    </Button>
                                    <Button onClick={() => RulesetService.deleteRuleset(ruleset.id)} className="hover:bg-background" size={"icon"} variant={"destructive"}>
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