
import { useEffect, useMemo } from "react";
import { ScrollArea } from "../../shadcn/scroll-area";
import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { HStack, VStack } from "../../custom/stack/Stack";
import { Copy, EllipsisVertical, GripHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { ATRule } from "@/core/application/atrule/atRule";
import { PixiImage } from "./OutputList";
import { AppCore } from "@/core/appcore";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";


export default function RuleList() {
    const { version, session, setSelectedRule } = useEditRulesetStore();

    const ruleList = useMemo(() => {
        const ruleset = session.ruleset;
        return ruleset.getAllRules();
    }, [version, session])

    useEffect(() => {
        const ruleList = session.ruleset.getAllRules();
        if (ruleList.length > 0) setSelectedRule(ruleList[0].id);
    }, [])

    return (
        <ScrollArea className="w-auto h-full overflow-hidden">
            <VStack className="w-full h-full gap-2">
                {ruleList.map((rule, index) => {
                    return <RuleItem key={rule.id} rule={rule} index={index} />
                })}
            </VStack>
        </ScrollArea>
    )
}

function RuleItem({ rule, index }: { rule: ATRule, index: number }) {
    const { session, version, setSelectedRule } = useEditRulesetStore();

    const selectedRuleId = useMemo(() => {
        return session.getSelectedRule()?.id;
    }, [session, version])

    const pixiApp = useMemo(() => {
        return session.pixiApp;
    }, [session, version]);

    const ruleOutputs = useMemo(() => {
        return rule.getOutputs();
    }, [session, version])

    return (
        <HStack
            key={rule.id}
            align="center"
            onClick={() => setSelectedRule(rule.id)}
            draggable
            className={`w-full h-12 p-2 flex gap-4 ${selectedRuleId === rule.id ? "bg-select-color/50" : "bg-secondary-background hover:bg-select-color/20"}`}
        >
            <GripHorizontal size={16} className="cursor-grab active:cursor-grabbing" />
            {index + 1}
            <RuleToolTip rule={rule}>
                <div className="size-8 border border-foreground/20">
                    {pixiApp && ruleOutputs.length > 0 && (() => {
                        const firstOutput = ruleOutputs[0];
                        const tilesetId = session.ruleset.tilesetRefManager.getTilesetIdByIndex(firstOutput.tilesetIndex);
                        if (!tilesetId) return null;
                        const textureManager = AppCore.getIns().editorContext.textureManager;
                        const tilesetTexture = textureManager.getTileTexture(tilesetId, firstOutput.tileId);
                        if (!tilesetTexture) return null;
                        return (
                            <PixiImage texture={tilesetTexture} pixiApp={pixiApp} />
                        )
                    })()}
                </div>
            </RuleToolTip>
            <RuleDropdown rule={rule} />
        </HStack>
    )
}

function RuleDropdown({ rule }: { rule: ATRule }) {
    const { session, refresh } = useEditRulesetStore();

    const ruleset = useMemo(() => {
        return session.ruleset;
    }, [session])

    const handleDuplicate = () => {
        // TODO: 
        refresh();
    }

    const handleDelete = () => {
        ruleset.removeRule(rule);
        refresh();
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <div className="size-8 flex items-center justify-center ml-auto hover:bg-foreground/10" onClick={(e) => { e.stopPropagation() }}>
                    <EllipsisVertical size={16} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" className="bg-secondary-background w-40 gap-2" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleDuplicate} className="h-dropdown-menu text-dropdown-menu">
                    <Copy className="size-4" />
                    Duplicate rule
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} variant="destructive" className="h-dropdown-menu text-dropdown-menu">
                    <Trash2 className="size-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function RuleToolTip({ rule, children }: { rule: ATRule, children: React.ReactNode }) {

    return (
        <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                sideOffset={8}
                className="w-80 h-40 bg-secondary-background border border-foreground/20 shadow-md"
            >
                <HStack>

                </HStack>
            </TooltipContent>
        </Tooltip>
    )
}