import { ChangeEvent, FocusEvent, Fragment, KeyboardEvent, useCallback, useState } from "react";

import { Point2D, Point2DPropertyClass } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";
import { Input } from "@/ui/components/shadcn/input";
import { HStack, VStack } from "../custom/stack/Stack";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LocalizedText } from "../custom/LocalizeText";

type Point2DDraft = Record<keyof Point2D, string>;

export interface Point2DEditorProps {
    property: Point2DPropertyClass<any>;
}

export function Point2DPropertyEditor({ property }: Point2DEditorProps) {
    const [error, setError] = useState<TranslatableMessage | null>(null);

    const [isOpen, setIsOpen] = useState<boolean>(true);
    const toggleOpen = useCallback(() => {
        setIsOpen(!isOpen);
    }, [isOpen])

    const [draft, setDraft] = useState<Point2DDraft>(() => toDraftValue(property.getter()));

    const resetDraft = useCallback(() => {
        setDraft(toDraftValue(property.getter()));
    }, [property]);

    const validateDraft = useCallback((nextDraft: Point2DDraft): boolean => {
        if (!isCompletePointInput(nextDraft)) {
            setError(null);
            return false;
        }

        const validateResult = property.validate(toPointValue(nextDraft));

        if (validateResult.status === Result.Status.Error) {
            setError(validateResult.message ?? null);
            return false;
        }

        setError(null);
        return validateResult.status === Result.Status.Success;
    }, [property, setError]);

    const handleChange = useCallback((axis: keyof Point2D, event: ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        if (!isAllowedNumberDraft(rawValue)) {
            return;
        }

        const nextDraft = { ...draft, [axis]: rawValue };
        setDraft(nextDraft);
        validateDraft(nextDraft);
    }, [draft, validateDraft]);

    const handleConfirmChange = useCallback((nextDraft: Point2DDraft) => {
        if (!isCompletePointInput(nextDraft)) {
            setError(null);
            resetDraft();
            return;
        }

        const value = toPointValue(nextDraft);
        const validateResult = property.validate(value);

        setError(null);

        switch (validateResult.status) {
            case Result.Status.Error:
            case Result.Status.Cancel:
                resetDraft();
                break;

            case Result.Status.Success:
                property.setter(value);
                setDraft(toDraftValue(value));
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

    const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
        const nextFocusedElement = event.relatedTarget;
        if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
            return;
        }

        handleConfirmChange(draft);
    }, [draft, handleConfirmChange]);

    return (
        <VStack className="px-2">
            <div className="flex h-8 items-center gap-2" onClick={toggleOpen}>
                <ChevronUp size={14} className={`${isOpen ? "rotate-180" : "rotate-90"} duration-50`} />
                <label className="w-fit truncate text-2xs text-shadow-foreground" title={property.label}>
                    {property.label}
                </label>
            </div>
            {isOpen && (
                <HStack className="gap-2 pb-2" onBlur={handleBlur}>
                    <PointAxisInput
                        label={property.pointLabel.x}
                        value={draft.x}
                        disabled={property.disabled() || property.readonly()}
                        readOnly={property.readonly()}
                        onChange={(event) => handleChange("x", event)}
                        onKeyDown={handleKeyDown}
                    />
                    <PointAxisInput
                        label={property.pointLabel.y}
                        value={draft.y}
                        disabled={property.disabled() || property.readonly()}
                        readOnly={property.readonly()}
                        onChange={(event) => handleChange("y", event)}
                        onKeyDown={handleKeyDown}
                    />
                </HStack>
            )}
            {error && <span className="mt-1 pl-[calc(40%+0.5rem)] text-2 text-destructive"><LocalizedText message={error} /></span>}
        </VStack>
    )
}

function PointAxisInput({ label, value, disabled, readOnly, onChange, onKeyDown }: {
    label: string;
    value: string;
    disabled: boolean;
    readOnly: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
    return (
        <label className="flex min-w-0 items-center gap-1">
            <span className="max-w-10 shrink-0 truncate text-[10px] text-shadow-foreground" title={label}>
                {label}
            </span>
            <Input
                className="h-6 text-2xs px-1.5"
                type="text"
                inputMode="decimal"
                value={value}
                disabled={disabled}
                readOnly={readOnly}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
        </label>
    );
}

function toDraftValue(value: Point2D): Point2DDraft {
    return {
        x: String(value.x),
        y: String(value.y),
    };
}

function toPointValue(value: Point2DDraft): Point2D {
    return {
        x: Number(value.x),
        y: Number(value.y),
    };
}

function isCompletePointInput(value: Point2DDraft): boolean {
    return isCompleteNumberInput(value.x) && isCompleteNumberInput(value.y);
}

function isAllowedNumberDraft(rawValue: string): boolean {
    return rawValue === "" || rawValue === "-" || rawValue === "+" || !Number.isNaN(Number(rawValue));
}

function isCompleteNumberInput(rawValue: string): boolean {
    if (rawValue.trim() === "") return false;
    if (rawValue === "-" || rawValue === "+") return false;
    if (rawValue.endsWith(".")) return false;

    return Number.isFinite(Number(rawValue));
}
