import { ATRuleset } from "@/core/application/atrule/atRuleset";
import { useState } from "react";
import { HStack, VStack } from "../../custom/stack/Stack";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { SketchPicker } from "react-color";
import { Button } from "../../shadcn/button";
import { Plus } from "lucide-react";
import { useEditRulesetStore } from "@/view/stores/editRulesetStore";

export default function RuleHeader() {
    const { version, ruleset, refresh } = useEditRulesetStore();

    const [tempName, setTempName] = useState(ruleset.name);
    const [tempColor, setTempColor] = useState(ruleset.color);

    const handleRename = () => {
        if (tempName.trim() == "") {
            setTempName(ruleset.name);
        } else {
            ruleset.name = tempName;
        }
    };

    const addRule = () => {
        ruleset.addEmptyRule();
        refresh();
    }

    const customStyles = {
        default: {
            picker: {
                width: '220px',
                padding: '0px',
                boxShadow: '0 0 0 0',
                background: 'var(--background)'
            }
        }
    };

    return (
        <HStack className="gap-2">
            <DropdownMenu onOpenChange={() => ruleset.color = tempColor} modal={false}>
                <DropdownMenuTrigger asChild>
                    <div className="h-8 w-8" style={{ backgroundColor: tempColor }} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="right" sideOffset={8} className="w-fit h-fit bg-background p-4">
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
                onKeyDown={(e) => { if (e.key === "Enter") handleRename() }}
                className="text-sm flex-1 border py-1 px-2 focus:outline-1 focus:outline-foreground bg-secondary-background min-w-0"
            />
            <Button size={"icon"} variant={"outline"} onClick={addRule}>
                <Plus />
            </Button>
        </HStack>
    )
}