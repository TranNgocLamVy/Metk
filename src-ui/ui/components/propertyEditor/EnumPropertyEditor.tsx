import { EnumPropertyClass } from "@/editor/properties/properties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/shadcn/select";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface EnumEditorProps {
    property: EnumPropertyClass<any>;
}

export function EnumPropertyEditor({ property }: EnumEditorProps) {
    const [draft, setDraft] = useState<string>();

    useEffect(() => setDraft(property.getter()), [])

    const options = useMemo(() => property.options(), [])

    const onValueChange = useCallback((value: string) => {
        property.setter(value);
        setDraft(property.getter());
    }, [])

    return (
        <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] items-center px-2 py-1.5 gap-2">
            <label className="min-w-0 truncate text-xs text-shadow-foreground" title={property.label}>
                {property.label}
            </label>
            <Select
                disabled={property.readonly() || property.disabled() || options.length === 0}
                value={draft}
                onValueChange={onValueChange}
            >
                <SelectTrigger className="w-full bg-surface-sunken">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-overlay-raised">
                    {options.map((option, index) => (
                        <SelectItem className="text-foreground" key={`${option.value}`} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}