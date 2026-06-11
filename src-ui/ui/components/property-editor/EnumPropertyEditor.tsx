import { useCallback, useEffect, useMemo, useState } from "react";

import { EnumPropertyClass } from "@/editor/properties/properties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/shadcn/select";

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { Label } from "@/ui/components/shadcn/label";
import { usePropertyStoreVersion } from "@/ui/stores/property.store";
import { useTranslation } from "react-i18next";
import { clonePropertyValue, executeUpdatePropertyCommand } from "./property-command.utils";

export interface EnumEditorProps {
    property: EnumPropertyClass<any>;
}

export function EnumPropertyEditor({ property }: EnumEditorProps) {
    const { t } = useTranslation();
    const version = usePropertyStoreVersion()

    const [draft, setDraft] = useState<string>();

    useEffect(() => {
        setDraft(property.getter());
    }, [property, version]);

    const options = useMemo(() => property.options(), [property, version]);

    const onValueChange = useCallback((value: string) => {
        const oldValue = clonePropertyValue(property.getter());

        executeUpdatePropertyCommand(property, oldValue, value);
        setDraft(property.getter());
    }, [property]);

    return (
        <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] items-center px-2 h-8 gap-2">
            <Label title={t(property.label)} className="text-2xs min-w-0 truncate">
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

                <SelectContent className="bg-surface-raised">
                    {options.map((option) => (
                        <SelectItem
                            className="text-foreground"
                            key={`${option.value}`}
                            value={String(option.value)}
                        >
                            <LocalizedText message={option.label} />
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}