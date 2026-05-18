import { useCallback, useEffect, useRef, useState } from "react";
import { HStack, VStack } from "../../custom/stack/Stack";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { SketchPicker } from "react-color";
import { Button } from "../../shadcn/button";
import { Copy, EllipsisVertical, GripHorizontal, Plus, Trash2 } from "lucide-react";
import { DialogClose } from "../../shadcn/dialog";
import { useDialogStore } from "@/ui/stores/dialogStore";
import { LocalizedText } from "../../custom/LocalizeText";
import { appCore } from "@/editor/appcore";
import { ScrollArea } from "../../shadcn/scroll-area";
import PixiImage from "../../custom/PixiImage";
import { useEditRuleset } from "./ContextProvider";

type EditRulesetSidebarProps = {
    dialogId: string;
}

export default function EditRulesetSidebar({ dialogId }: EditRulesetSidebarProps) {
    const { closeDialog } = useDialogStore();
    const { ruleset } = useEditRuleset();

    const handleSave = useCallback(async () => {
        const currentProject = appCore.editorContext.currentProject;
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

    useEffect(() => {
        if (ruleList.length > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevLengthRef.current = ruleList.length;
    }, [ruleList.length]);

    return (
        <ScrollArea className="w-auto h-full overflow-hidden">
            <VStack className="w-full h-full">
                {ruleList.map((rule, index) => {
                    const isSelected = selectedRuleId === rule.id;
                    const ruleOutputs = rule.getOutputs()
                    return (
                        <HStack key={rule.id + index} align="center" draggable onClick={() => setSelectedRuleId(rule.id)} className={`w-full h-12 p-2 flex gap-4 ${isSelected ? "bg-accent text-accent-foreground" : "bg-surface-base hover:bg-accent/50 hover:text-accent-foreground"}`} >
                            <GripHorizontal size={16} className="cursor-grab active:cursor-grabbing" />
                            <span>{index + 1}</span>
                            <div className="size-8 border border-foreground/20">
                                {ruleOutputs.length > 0 && (() => {
                                    const firstOutput = ruleOutputs[0];
                                    const tilesetId = ruleset.tilesetRefManager.getTilesetRefId(firstOutput.tilesetIndex);
                                    if (!tilesetId) return null;
                                    const textureManager = appCore.editorContext.textureManager;
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