
import { useMemo } from "react";
import { ScrollArea } from "../../shadcn/scroll-area";
import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { HStack, VStack } from "../../custom/stack/Stack";
import { Copy, EllipsisVertical, GripHorizontal, Pen, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { ATRule } from "@/core/application/atrule/atRule";


export default function RuleList() {
    const { version, ruleset } = useEditRulesetStore();

    const ruleList = useMemo(() => {
        return ruleset.getAllRules();
    }, [version])

    return (
        <ScrollArea className="w-full h-full overflow-hidden">
            <VStack className="w-full h-full gap-2">
                {ruleList.map((rule, index) => {
                    return <RuleItem key={rule.id} rule={rule} index={index} />
                })}
            </VStack>
        </ScrollArea>
    )
}

function RuleItem({ rule, index }: { rule: ATRule, index: number }) {
    const { selectedRule, setSelectedRule } = useEditRulesetStore();

    return (
        <HStack
            key={rule.id}
            align="center"
            onClick={() => setSelectedRule(rule.id)}
            draggable
            className={`w-full h-12 p-2 flex gap-4 ${selectedRule === rule.id ? "bg-select-color/50" : "bg-secondary-background"}`}
        >
            <GripHorizontal size={16} className="cursor-grab active:cursor-grabbing" />

            <HStack align="center" className="gap-2">
                {index + 1}
                <div className="size-8 border border-foreground/20" />
            </HStack>
            <RuleDropdown rule={rule} />
        </HStack>
    )
}

function RuleDropdown({ rule }: { rule: ATRule }) {
    const { ruleset, refresh } = useEditRulesetStore();

    const handleDuplicate = () => {
        console.log(rule);
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