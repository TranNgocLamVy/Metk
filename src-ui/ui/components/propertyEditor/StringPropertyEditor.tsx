import { ChangeEvent, KeyboardEvent, useCallback, useState } from "react";
import { Input } from "@/ui/components/shadcn/input";
import { StringPropertyClass } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";
import { LocalizedText } from "../custom/LocalizeText";

export interface StringEditorProps {
    property: StringPropertyClass<any>;
}

export function StringPropertyEditor({ property }: StringEditorProps) {
    const [error, setError] = useState<TranslatableMessage | null>(null);
    const [draft, setDraft] = useState<string>(property.getter());

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDraft(event.target.value);
        const validateResult = property.validate(event.target.value);
        if (validateResult.status == Result.Status.Error) {
            setError(validateResult.message ?? null);
        } else {
            setError(null);
        }
    }, [])

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleConfirmChange(draft);
            event.currentTarget.blur();
        } else if (event.key === "Escape") {
            setError(null);
            setDraft(property.getter());
            event.currentTarget.blur();
        }
    }, [draft])


    const handleConfirmChange = useCallback((value: string) => {
        const validateResult = property.validate(value);
        setError(null);
        switch (validateResult.status) {
            case Result.Status.Error:
            case Result.Status.Cancel:
                setDraft(property.getter());
                break;
            case Result.Status.Success:
                if (value.trim() === property.getter().trim()) return;
                property.setter(value.trim());
                setDraft(property.getter());
                break;
        }
    }, [])

    return (
        <div className="px-2 h-8">
            <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] items-center h-full gap-2">
                <label className="min-w-0 truncate text-2xs text-shadow-foreground" title={property.label}>
                    {property.label}
                </label>
                <Input
                    value={draft}
                    maxLength={property.maxLength}
                    disabled={property.disabled() || property.readonly()}
                    readOnly={property.readonly()}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => handleConfirmChange(draft)}
                    className="h-6 text-2xs"
                />
            </div>
            {error && <span className="mt-1 pl-[calc(40%+0.5rem)] text-[10px] text-2xs text-destructive"><LocalizedText message={error} /></span>}
        </div>

    );
}