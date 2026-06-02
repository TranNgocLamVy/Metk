import { type DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";
import { SketchPicker } from "react-color";
import { Button } from "@/ui/components/shadcn/button";
import { Copy, EllipsisVertical, GripHorizontal, Plus, Trash2 } from "lucide-react";
import { DialogClose } from "@/ui/components/shadcn/dialog";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { ScrollArea } from "@/ui/components/shadcn/scroll-area";
import PixiImage from "@/ui/components/custom/PixiImage";
import { useEditRuleset } from "./ContextProvider";

const RULE_DRAG_DATA_TYPE = "application/metk-rule-id";

type RuleDropPosition = "before" | "after";

type EditRulesetSidebarProps = {
    dialogId: string;
}

export default function EditRulesetSidebar({ dialogId }: EditRulesetSidebarProps) {
    const { closeDialog } = useDialogStore();
    const { ruleset } = useEditRuleset();

    const handleSave = useCallback(async () => {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return;

        const rulesetManager = currentProject.rulesetManager;
        rulesetManager.updateRuleset(ruleset.serialize());
        await rulesetManager.saveRuleset(ruleset.id);

        closeDialog(dialogId);
    }, [ruleset, closeDialog, dialogId]);

    return (
        <VStack className="w-fit h-full bg-surface-overlay p-2 gap-2">
            <Header />
            <RuleList />
            <HStack className="w-full h-fit gap-2">
                <DialogClose asChild>
                    <Button variant="outline" type="button" onClick={() => closeDialog(dialogId)} className="ml-auto"><LocalizedText message="dialog.editRuleset.action.discard" /></Button>
                </DialogClose>
                <Button type="button" onClick={handleSave}><LocalizedText message="dialog.editRuleset.action.save" /></Button>
            </HStack>
        </VStack>
    )
}

function Header() {
    const { ruleset, actions } = useEditRuleset();

    const [tempData, setTempData] = useState({ name: ruleset.name, color: ruleset.color });

    const handleRename = useCallback(() => {
        if (tempData.name.trim() === "") {
            setTempData(prev => ({ ...prev, name: ruleset.name }));
        } else {
            actions.updateRulesetName(tempData.name);
        }
    }, [tempData.name, actions, ruleset.name]);

    const customStyles = {
        default: { picker: { width: '220px', padding: '0px', boxShadow: '0 0 0 0', background: 'var(--background)' } }
    };

    return <HStack className="gap-2 w-full">
        <DropdownMenu onOpenChange={() => actions.updateRulesetColor(tempData.color)} modal={false}>
            <DropdownMenuTrigger asChild>
                <div className="h-full aspect-square" style={{ backgroundColor: tempData.color }} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="right" sideOffset={8} className="w-fit h-fit bg-surface-overlay shadow-lg p-4">
                <VStack className="custom-sketch-picker w-fit">
                    <style>{`.custom-sketch-picker label { color: var(--foreground) !important; }`}</style>
                    <SketchPicker color={tempData.color} onChange={(color) => setTempData(prev => ({ ...prev, color: color.hex }))} styles={customStyles} disableAlpha presetColors={[]} />
                </VStack>
            </DropdownMenuContent>
        </DropdownMenu>
        <input
            value={tempData.name}
            onChange={(e) => setTempData(prev => ({ ...prev, name: e.target.value }))}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
            className="text-sm w-full border border-foreground/20 py-1 px-2 focus:outline-1 focus:outline-foreground bg-surface-overlay-sunken"
        />
        <Button size="icon" variant="ghost" onClick={actions.addEmptyRule} className="h-full aspect-square">
            <Plus />
        </Button>
    </HStack>
}

function RuleList() {
    const { ruleset, ruleList, selectedRuleId, setSelectedRuleId, actions } = useEditRuleset();

    const bottomRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);
    const draggedRuleIdRef = useRef<string | null>(null);
    const [draggedRuleId, setDraggedRuleId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ ruleId: string; position: RuleDropPosition } | null>(null);

    useEffect(() => {
        if (ruleList.length > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevLengthRef.current = ruleList.length;
    }, [ruleList.length]);

    const getDropPosition = useCallback((e: DragEvent<HTMLElement>): RuleDropPosition => {
        const rect = e.currentTarget.getBoundingClientRect();
        return e.clientY - rect.top < rect.height / 2 ? "before" : "after";
    }, []);

    const handleDragStart = useCallback((e: DragEvent<HTMLElement>, ruleId: string) => {
        draggedRuleIdRef.current = ruleId;
        setDraggedRuleId(ruleId);
        e.dataTransfer.setData(RULE_DRAG_DATA_TYPE, ruleId);
        e.dataTransfer.setData("text/plain", ruleId);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLElement>, targetRuleId: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";

        if ((draggedRuleIdRef.current ?? draggedRuleId) === targetRuleId) {
            setDropTarget(null);
            return;
        }

        const position = getDropPosition(e);
        setDropTarget((current) => {
            if (current?.ruleId === targetRuleId && current.position === position) return current;
            return { ruleId: targetRuleId, position };
        });
    }, [draggedRuleId, getDropPosition]);

    const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(null);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLElement>, targetRuleId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const ruleId = e.dataTransfer.getData(RULE_DRAG_DATA_TYPE) || e.dataTransfer.getData("text/plain") || draggedRuleIdRef.current;
        draggedRuleIdRef.current = null;
        setDraggedRuleId(null);
        setDropTarget(null);

        if (!ruleId || ruleId === targetRuleId) return;
        actions.moveRule(ruleId, targetRuleId, getDropPosition(e));
    }, [actions, getDropPosition]);

    const handleDragEnd = useCallback(() => {
        draggedRuleIdRef.current = null;
        setDraggedRuleId(null);
        setDropTarget(null);
    }, []);

    return (
        <ScrollArea className="w-auto h-full overflow-hidden">
            <VStack className="w-full h-full">
                {ruleList.map((rule, index) => {
                    const isSelected = selectedRuleId === rule.id;
                    const ruleOutputs = rule.getOutputs()
                    const isDropTarget = dropTarget?.ruleId === rule.id;
                    return (
                        <HStack
                            key={rule.id}
                            align="center"
                            draggable
                            onDragStart={(e) => handleDragStart(e, rule.id)}
                            onDragOver={(e) => handleDragOver(e, rule.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, rule.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedRuleId(rule.id)}
                            className={`w-full h-12 p-2 flex gap-4 ${isSelected ? "bg-accent text-accent-foreground" : "bg-surface-base hover:bg-accent/50 hover:text-accent-foreground"}`}
                            style={{
                                borderTop: isDropTarget && dropTarget.position === "before" ? "2px solid #3b82f6" : "2px solid transparent",
                                borderBottom: isDropTarget && dropTarget.position === "after" ? "2px solid #3b82f6" : "2px solid transparent",
                                opacity: draggedRuleId === rule.id ? 0.5 : 1,
                            }}
                        >
                            <GripHorizontal size={16} className="cursor-grab active:cursor-grabbing" />
                            <span>{index + 1}</span>
                            <div className="size-8 border border-foreground/20">
                                {ruleOutputs.length > 0 && (() => {
                                    const firstOutput = ruleOutputs[0];
                                    const tilesetId = ruleset.tilesetRefManager.getTilesetRefId(firstOutput.tilesetIndex);
                                    if (!tilesetId) return null;
                                    const textureManager = appKernel.editorFacade.textureManager;
                                    const tilesetTexture = textureManager.getTileTexture(tilesetId, firstOutput.tileId);
                                    return <PixiImage texture={tilesetTexture} />;
                                })()}
                            </div>
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="empty" size="sm" className="h-6 w-6 p-0 shrink-0 ml-auto hover:bg-foreground/10">
                                        <EllipsisVertical size={16} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="right" className="bg-surface-overlay w-40 gap-2" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => actions.duplicateRule(rule.id)} className="h-7 text-xs">
                                        <Copy className="size-4" />
                                        <LocalizedText message="dialog.editRuleset.action.duplicate" />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => actions.removeRule(rule.id)} variant="destructive" className="h-7 text-xs">
                                        <Trash2 className="size-4" />
                                        <LocalizedText message="dialog.editRuleset.action.delete" />
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </HStack>
                    )
                })}
                <div ref={bottomRef} />
            </VStack>
        </ScrollArea>
    );
}
