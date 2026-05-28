import { useCallback, useEffect, useMemo, useState } from "react";
import { Label } from "../shadcn/label";
import { EnumPropertyClass } from "@/editor/properties/properties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/shadcn/select";
import { LocalizedText } from "../custom/LocalizeText";
import { clonePropertyValue, executeUpdatePropertyCommand } from "./property-command.utils";

export interface EnumEditorProps {
    property: EnumPropertyClass<any>;
}

export function EnumPropertyEditor({ property }: EnumEditorProps) {
    const [draft, setDraft] = useState<string>();

    useEffect(() => {
        setDraft(property.getter());
    }, [property]);

    const options = useMemo(() => property.options(), [property]);

    const onValueChange = useCallback((value: string) => {
        const oldValue = clonePropertyValue(property.getter());

        executeUpdatePropertyCommand(property, oldValue, value);
        setDraft(property.getter());
    }, [property]);

    return (
        <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] items-center px-2 h-8 gap-2">
            <Label title={property.label} className="text-2xs min-w-0 truncate">
                <LocalizedText message={property.label} />
            </Label>
            <Select
                disabled={property.readonly() || property.disabled() || options.length === 0}
                value={draft}
                onValueChange={onValueChange}
            >
                <SelectTrigger size="sm" className="w-full bg-surface-sunken text-2xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-overlay-raised">
                    {options.map((option) => (
                        <SelectItem className="text-foreground" key={`${option.value}`} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}