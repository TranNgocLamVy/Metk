import { ChangeEvent, KeyboardEvent, useCallback, useState } from "react";

import { Input } from "@/ui/components/shadcn/input";
import { NumberPropertyClass } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";
import { LocalizedText } from "../custom/LocalizeText";
import { Label } from "../shadcn/label";

import {
    getStepFromPrecision,
    isAllowedNumberDraft,
    isCompleteNumberInput,
    matchesPrecision,
    normalizeNumber,
    toFiniteNumber,
    useHorizontalNumberDrag,
} from "./number-drag.utils";

export interface NumberEditorProps {
    property: NumberPropertyClass<any>;
}

export function NumberPropertyEditor({ property }: NumberEditorProps) {
    const [error, setError] = useState<TranslatableMessage | null>(null);
    const [draft, setDraft] = useState<string>(toDraftValue(property.getter(), property.precision));

    const disabled = property.disabled() || property.readonly();

    const resetDraft = useCallback(() => {
        setDraft(toDraftValue(property.getter(), property.precision));
    }, [property]);

    const validateDraft = useCallback((rawValue: string): boolean => {
        if (!isCompleteNumberInput(rawValue)) {
            setError(null);
            return false;
        }

        if (!matchesPrecision(rawValue, property.precision)) {
            setError({
                key: "property.number.precisionExceeded",
                values: { precision: property.precision },
            } as TranslatableMessage);
            return false;
        }

        const value = Number(rawValue);
        const validateResult = property.validate(value);

        if (validateResult.status === Result.Status.Error) {
            setError(validateResult.message ?? null);
            return false;
        }

        setError(null);
        return validateResult.status === Result.Status.Success;
    }, [property]);

    const applyValue = useCallback((rawValue: number, resetOnReject: boolean): boolean => {
        const value = normalizeNumber(rawValue, property.precision);
        const validateResult = property.validate(value);

        setError(null);

        switch (validateResult.status) {
            case Result.Status.Error:
                setError(validateResult.message ?? null);
                if (resetOnReject) resetDraft();
                return false;

            case Result.Status.Cancel:
                if (resetOnReject) resetDraft();
                return false;

            case Result.Status.Success:
                property.setter(value);
                setDraft(toDraftValue(property.getter(), property.precision));
                return true;
        }
    }, [property, resetDraft]);

    const { isDragging, dragProps } = useHorizontalNumberDrag({
        disabled,
        precision: property.precision,
        min: property.min,
        max: property.max,
        wrapCursor: true,
        getValue: () => toFiniteNumber(property.getter()),
        onValueChange: (value) => applyValue(value, false),
        onDragEnd: () => {
            setError(null);
            resetDraft();
        },
    });

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;

        if (!isAllowedNumberDraft(rawValue)) {
            return;
        }

        setDraft(rawValue);
        validateDraft(rawValue);
    }, [validateDraft]);

    const handleConfirmChange = useCallback((rawValue: string) => {
        if (!isCompleteNumberInput(rawValue)) {
            setError(null);
            resetDraft();
            return;
        }

        if (!matchesPrecision(rawValue, property.precision)) {
            setError(null);
            resetDraft();
            return;
        }

        applyValue(Number(rawValue), true);
    }, [property.precision, resetDraft, applyValue]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleConfirmChange(draft);
            event.currentTarget.blur();
        } else if (event.key === "Escape") {
            setError(null);
            resetDraft();
            event.currentTarget.blur();
        }
    }, [draft, handleConfirmChange, resetDraft]);

    return (
        <div className="px-2 h-8">
            <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] h-full items-center gap-2">
                <Label
                    title={property.label}
                    {...dragProps}
                    className={[
                        "text-2xs min-w-0 truncate select-none",
                        disabled ? "cursor-default" : "cursor-ew-resize",
                        isDragging ? "text-primary" : "",
                    ].join(" ")}
                >
                    <LocalizedText message={property.label} />
                </Label>

                <Input
                    type="text"
                    inputMode="decimal"
                    value={draft}
                    min={property.min}
                    max={property.max}
                    step={getStepFromPrecision(property.precision)}
                    readOnly={property.readonly()}
                    disabled={disabled}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => handleConfirmChange(draft)}
                    className="h-6 text-2xs"
                />
            </div>

            {error && (
                <span className="mt-1 pl-[calc(40%+0.5rem)] text-2xs text-destructive">
                    <LocalizedText message={error} />
                </span>
            )}
        </div>
    );
}

function toDraftValue(value: number, precision?: number): string {
    return String(normalizeNumber(toFiniteNumber(value), precision));
}