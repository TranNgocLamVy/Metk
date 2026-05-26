import { BooleanPropertyClass } from "@/editor/properties/properties";
import { Checkbox } from "@/ui/components/shadcn/checkbox";
import { useState } from "react";
import { Label } from "../shadcn/label";
import { LocalizedText } from "../custom/LocalizeText";

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
            <Label title={property.label} className="text-2xs min-w-0 truncate">
                <LocalizedText message={property.label} />
            </Label>
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