import { ChangeEvent, KeyboardEvent, useCallback, useMemo, useState } from "react";

import { Input } from "@/ui/components/shadcn/input";
import { NumberPropertyClass } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";
import { LocalizedText } from "../custom/LocalizeText";

export interface NumberEditorProps {
    property: NumberPropertyClass<any>;
}

export function NumberPropertyEditor({ property }: NumberEditorProps) {
    const [error, setError] = useState<TranslatableMessage | null>(null);
    const [draft, setDraft] = useState<string>(String(property.getter()));

    const resetDraft = useCallback(() => {
        setDraft(toDraftValue(property.getter()));
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
    }, [property, setError]);

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        if (rawValue !== "" && Number.isNaN(Number(rawValue)) && rawValue !== "-" && rawValue !== "+") {
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

        const value = Number(rawValue);
        const validateResult = property.validate(value);

        setError(null);

        switch (validateResult.status) {
            case Result.Status.Error:
            case Result.Status.Cancel:
                resetDraft();
                break;

            case Result.Status.Success:
                property.setter(value);
                setDraft(toDraftValue(property.getter()));
                break;
        }
    }, [property, resetDraft, setError]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleConfirmChange(draft);
            event.currentTarget.blur();
        } else if (event.key === "Escape") {
            setError(null);
            resetDraft();
            event.currentTarget.blur();
        }
    }, [draft, handleConfirmChange, resetDraft, setError]);

    return (
        <div className="px-2 py-1.5">
            <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] items-center gap-2">
                <label className="min-w-0 truncate text-xs text-shadow-foreground" title={property.label}>
                    {property.label}
                </label>
                <Input
                    type="text"
                    inputMode="decimal"
                    value={draft}
                    min={property.min}
                    max={property.max}
                    step={property.precision}
                    readOnly={property.readonly()}
                    disabled={property.disabled() || property.readonly()}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={() => handleConfirmChange(draft)}
                />
            </div>
            {error && <span className="mt-1 pl-[calc(40%+0.5rem)] text-[10px] text-destructive"><LocalizedText message={error} /></span>}
        </div>

    );
}

function toDraftValue(value: number): string {
    return String(value);
}

function isCompleteNumberInput(rawValue: string): boolean {
    if (rawValue.trim() === "") return false;
    if (rawValue === "-" || rawValue === "+") return false;
    if (rawValue.endsWith(".")) return false;

    return Number.isFinite(Number(rawValue));
}

function getDecimalPlaces(rawValue: string): number {
    const normalized = rawValue.toLowerCase();

    // Handle scientific notation, e.g. 1e-3 has 3 decimal places.
    if (normalized.includes("e")) {
        const value = Number(normalized);
        if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;

        const [, exponentPart] = normalized.split("e");
        const exponent = Number(exponentPart);
        const mantissaDecimalPlaces = normalized.split("e")[0].split(".")[1]?.length ?? 0;

        return Math.max(0, mantissaDecimalPlaces - exponent);
    }

    return normalized.split(".")[1]?.length ?? 0;
}

function matchesPrecision(rawValue: string, precision: number | undefined): boolean {
    if (precision === undefined) return true;
    if (!Number.isInteger(precision) || precision < 0) return true;

    return getDecimalPlaces(rawValue) <= precision;
}

function getStepFromPrecision(precision: number | undefined): number | undefined {
    if (precision === undefined) return undefined;
    if (!Number.isInteger(precision) || precision < 0) return undefined;

    return 1 / 10 ** precision;
}