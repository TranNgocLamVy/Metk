// src-ui/view/components/dialog/RuleList.tsx
import { useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "../../shadcn/scroll-area";
import { HStack, VStack } from "../../custom/stack/Stack";
import { Copy, EllipsisVertical, GripHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { appCore } from "@/core/appcore";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";
import PixiImage from "../../custom/PixiImage";
import { useEditRuleset } from "./EditRulesetContext";
import { Rule } from "@/core/application/rule/rule";

export default function RuleList() {    
    const { ruleset, version } = useEditRuleset();
    const bottomRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);

    const ruleList = useMemo(() => ruleset.getAllRules(), [ruleset, version]);

    useEffect(() => {
        if (ruleList.length > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevLengthRef.current = ruleList.length;
    }, [ruleList.length]);

    return (
        <ScrollArea className="w-auto h-full overflow-hidden">
            <VStack className="w-full h-full">
                {ruleList.map((rule, index) => (
                    <RuleItem key={rule.id} rule={rule} index={index} />
                ))}
                <div ref={bottomRef} />
            </VStack>
        </ScrollArea>
    );
}

function RuleItem({ rule, index }: { rule: Rule, index: number }) {
    const { ruleset, selectedRuleId, setSelectedRuleId, version, refresh } = useEditRuleset();

    const ruleOutputs = useMemo(() => rule.getOutputs(), [rule, version]);

    return (
        <HStack
            align="center"
            onClick={() => setSelectedRuleId(rule.id)}
            draggable
            className={`w-full h-12 p-2 flex gap-4 ${selectedRuleId === rule.id ? "bg-accent text-accent-foreground" : "bg-surface-base hover:bg-accent/50 hover:text-accent-foreground"}`}
        >
            <GripHorizontal size={16} className="cursor-grab active:cursor-grabbing" />
            {index + 1}
            <RuleToolTip rule={rule}>
                <div className="size-8 border border-foreground/20">
                    {ruleOutputs.length > 0 && (() => {
                        const firstOutput = ruleOutputs[0];
                        const tilesetId = ruleset.tilesetRefManager.getTilesetIdByIndex(firstOutput.tilesetIndex);
                        if (!tilesetId) return null;
                        const textureManager = appCore.editorContext.textureManager;
                        const tilesetTexture = textureManager.getTileTexture(tilesetId, firstOutput.tileId);
                        if (!tilesetTexture) return null;
                        return <PixiImage texture={tilesetTexture} />;
                    })()}
                </div>
            </RuleToolTip>
            <RuleDropdown rule={rule} />
        </HStack>
    );
}

function RuleDropdown({ rule }: { rule: Rule }) {
    const { ruleset, refresh } = useEditRuleset();

    const handleDuplicate = () => {
        ruleset.duplicateRule(rule.id);
        refresh();
    };

    const handleDelete = () => {
        ruleset.removeRule(rule);
        refresh();
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <div className="size-8 flex items-center justify-center ml-auto hover:bg-foreground/10" onClick={(e) => e.stopPropagation()}>
                    <EllipsisVertical size={16} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" className="bg-surface-overlay w-40 gap-2" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleDuplicate} className="h-7 text-xs">
                    <Copy className="size-4" />
                    Duplicate rule
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} variant="destructive" className="h-7 text-xs">
                    <Trash2 className="size-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function RuleToolTip({ children }: { rule: Rule, children: React.ReactNode }) {
    return (
        <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="w-80 h-40 bg-secondary-background border border-foreground/20 shadow-lg">
                <HStack></HStack>
            </TooltipContent>
        </Tooltip>
    );
}