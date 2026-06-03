import { SketchPicker } from "react-color";

import { EntityGraphicType } from "@/shared/data-types/entity.data";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { VStack } from "@/ui/components/custom/stack/Stack";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/shadcn/select";

import { useEditEntityDefinition } from "./ContextProvider";
import EntityGraphicOutputSelector from "./EntityGraphicOutputSelector";

export default function EntityDefinitionGraphicSelector() {
    const { entity, actions } = useEditEntityDefinition();

    return (
        <VStack className="w-full h-full gap-4">
            <VStack className="w-64 gap-2">
                <label className="text-xs text-muted-foreground">
                    <LocalizedText message="dialog.editEntity.graphicType" />
                </label>
                <Select value={entity.graphic.type} onValueChange={(value) => actions.updateGraphicType(value as EntityGraphicType)}>
                    <SelectTrigger size="sm" className="w-full bg-surface-sunken text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface">
                        <SelectItem className="text-foreground text-xs" value={EntityGraphicType.Color}>
                            <LocalizedText message="dialog.editEntity.color" />
                        </SelectItem>
                        <SelectItem className="text-foreground text-xs" value={EntityGraphicType.Tile}>
                            <LocalizedText message="dialog.editEntity.tile" />
                        </SelectItem>
                    </SelectContent>
                </Select>
            </VStack>

            {entity.graphic.type === EntityGraphicType.Color ? (
                <ColorGraphicSelector />
            ) : (
                <EntityGraphicOutputSelector />
            )}
        </VStack>
    );
}

function ColorGraphicSelector() {
    const { entity, actions } = useEditEntityDefinition();
    const color = entity.graphic.type === EntityGraphicType.Color ? entity.graphic.color : entity.color;

    const customStyles = {
        default: { picker: { width: "260px", padding: "0px", boxShadow: "0 0 0 0", background: "var(--background)" } },
    };

    return (
        <VStack className="custom-sketch-picker w-fit gap-2">
            <style>{`.custom-sketch-picker label { color: var(--foreground) !important; }`}</style>
            <label className="text-xs text-muted-foreground">
                <LocalizedText message="dialog.editEntity.color" />
            </label>
            <SketchPicker
                color={color}
                onChange={(nextColor) => actions.updateColor(nextColor.hex)}
                styles={customStyles}
                disableAlpha
                presetColors={[]}
            />
        </VStack>
    );
}
