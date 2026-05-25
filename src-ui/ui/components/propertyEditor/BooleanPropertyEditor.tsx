import { BooleanPropertyClass } from "@/editor/properties/properties";
import { Checkbox } from "@/ui/components/shadcn/checkbox";
import { useState } from "react";

export interface BooleanEditorProps {
    property: BooleanPropertyClass<any>;
}

export function BooleanPropertyEditor({ property }: BooleanEditorProps) {
    const [draft, setDraft] = useState<boolean>(property.getter());

    const onCheckedChange = (checked: boolean) => {
        property.setter(checked);
        setDraft(property.getter());
    }

    return (
        <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] px-2 h-8 items-center gap-2">
            <label className="min-w-0 truncate text-2xs" title={property.label}>
                {property.label}
            </label>
            <div className="flex items-center">
                <Checkbox
                    checked={draft}
                    disabled={property.disabled() || property.readonly()}
                    onCheckedChange={onCheckedChange}
                />
            </div>
        </div>
    );
}