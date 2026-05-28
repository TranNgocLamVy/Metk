import { ChangeEvent, KeyboardEvent, useCallback, useState } from "react";
import { Input } from "@/ui/components/shadcn/input";
import { StringPropertyClass } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";
import { LocalizedText } from "../custom/LocalizeText";
import { Label } from "../shadcn/label";
import { clonePropertyValue, executeUpdatePropertyCommand } from "./property-command.utils";

export interface StringEditorProps {
    property: StringPropertyClass<any>;
}

export function StringPropertyEditor({ property }: StringEditorProps) {
    const [error, setError] = useState<TranslatableMessage | null>(null);
    const [draft, setDraft] = useState<string>(property.getter());

    const resetDraft = useCallback(() => {
        setDraft(property.getter());
        setError(null);
    }, [property]);

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;

        setDraft(value);

        const validateResult = property.validate(value);

        if (validateResult.status === Result.Status.Error) {
            setError(validateResult.message ?? null);
        } else {
            setError(null);
        }
    }, [property]);

    const handleConfirmChange = useCallback((value: string) => {
        const oldValue = clonePropertyValue(property.getter());
        const nextValue = value.trim();

        const validateResult = property.validate(nextValue);

        setError(null);

        switch (validateResult.status) {
            case Result.Status.Error:
                setError(validateResult.message ?? null);
                resetDraft();
                break;

            case Result.Status.Cancel:
                resetDraft();
                break;

            case Result.Status.Success: {
                const result = executeUpdatePropertyCommand(property, oldValue, nextValue);

                if (result.status === Result.Status.Error) {
                    setError(result.message ?? null);
                }

                setDraft(property.getter());
                break;
            }
        }
    }, [property, resetDraft]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleConfirmChange(draft);
            event.currentTarget.blur();
        } else if (event.key === "Escape") {
            resetDraft();
            event.currentTarget.blur();
        }
    }, [draft, handleConfirmChange, resetDraft]);

    return (
        <div className="px-2 h-8">
            <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] items-center h-full gap-2">
                <Label title={property.label} className="text-2xs min-w-0 truncate">
                    <LocalizedText message={property.label} />
                </Label>

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

            {error && (
                <span className="mt-1 pl-[calc(40%+0.5rem)] text-[10px] text-2xs text-destructive">
                    <LocalizedText message={error} />
                </span>
            )}
        </div>
    );
}