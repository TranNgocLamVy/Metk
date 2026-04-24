// src-ui/view/components/dialog/RuleHeader.tsx
import { useState } from "react";
import { HStack, VStack } from "../../custom/stack/Stack";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { SketchPicker } from "react-color";
import { Button } from "../../shadcn/button";
import { Plus } from "lucide-react";
import { useEditRuleset } from "./EditRulesetContext";

export default function RuleHeader() {
    const { ruleset, refresh } = useEditRuleset();
    const [tempName, setTempName] = useState(ruleset.name);
    const [tempColor, setTempColor] = useState(ruleset.color);

    const handleRename = () => {
        if (tempName.trim() === "") {
            setTempName(ruleset.name);
        } else {
            ruleset.name = tempName;
        }
        refresh();
    };

    const addRule = () => {
        ruleset.addEmptyRule();
        refresh();
    };

    const customStyles = {
        default: { picker: { width: '220px', padding: '0px', boxShadow: '0 0 0 0', background: 'var(--background)' } }
    };

    return (
        <HStack className="gap-2 w-full">
            <DropdownMenu onOpenChange={() => { ruleset.color = tempColor; refresh(); }} modal={false}>
                <DropdownMenuTrigger asChild>
                    <div className="h-full aspect-square" style={{ backgroundColor: tempColor }} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="right" sideOffset={8} className="w-fit h-fit bg-surface-overlay shadow-lg p-4">
                    <VStack className="custom-sketch-picker w-fit">
                        <style>{`.custom-sketch-picker label { color: var(--foreground) !important; }`}</style>
                        <SketchPicker color={tempColor} onChange={(color) => setTempColor(color.hex)} styles={customStyles} disableAlpha presetColors={[]} />
                    </VStack>
                </DropdownMenuContent>
            </DropdownMenu>
            <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
                className="text-sm w-full border border-foreground/20 py-1 px-2 focus:outline-1 focus:outline-foreground bg-surface-overlay-sunken"
            />
            <Button size="icon" variant="ghost" onClick={addRule} className="h-full aspect-square">
                <Plus />
            </Button>
        </HStack>
    );
}