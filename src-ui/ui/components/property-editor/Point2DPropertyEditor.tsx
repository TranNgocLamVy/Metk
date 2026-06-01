import { ChevronUp } from "lucide-react";
import { ChangeEvent, FocusEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

import { Point2DPropertyClass } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";
import { Input } from "@/ui/components/shadcn/input";

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Label } from "@/ui/components/shadcn/label";
import { usePropertyStoreVersion } from "@/ui/stores/property.store";
import {
    isAllowedNumberDraft,
    isCompleteNumberInput,
    normalizeNumber,
    toFiniteNumber,
    useHorizontalNumberDrag,
} from "./number-drag.utils";
import { clonePropertyValue, executeUpdatePropertyCommand, previewUpdateProperty } from "./property-command.utils";

type Point2DDraft = Record<keyof Point2D, string>;

export interface Point2DEditorProps {
    property: Point2DPropertyClass<any>;
}

export function Point2DPropertyEditor({ property }: Point2DEditorProps) {
    const version = usePropertyStoreVersion()

    const [error, setError] = useState<TranslatableMessage | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [draft, setDraft] = useState<Point2DDraft>(() => toDraftValue(property.getter()));
    const dragStartValueRef = useRef<Point2D | null>(null);
    const isEditingRef = useRef(false);

    const disabled = property.disabled() || property.readonly();

    useEffect(() => {
        if (isEditingRef.current) return;
        if (dragStartValueRef.current !== null) return;

        setDraft(toDraftValue(property.getter()));
        setError(null);
    }, [property, version]);

    const toggleOpen = useCallback(() => {
        setIsOpen((current) => !current);
    }, []);

    const resetDraft = useCallback(() => {
        setDraft(toDraftValue(property.getter()));
    }, [property]);

    const validatePoint = useCallback((value: Point2D): boolean => {
        const validateResult = property.validate(value);

        if (validateResult.status === Result.Status.Error) {
            setError(validateResult.message ?? null);
            return false;
        }

        setError(null);
        return validateResult.status === Result.Status.Success;
    }, [property]);

    const validateDraft = useCallback((nextDraft: Point2DDraft): boolean => {
        if (!isCompletePointInput(nextDraft)) {
            setError(null);
            return false;
        }

        return validatePoint(toPointValue(nextDraft));
    }, [validatePoint]);

    const applyPointValue = useCallback((
        value: Point2D,
        resetOnReject: boolean,
        commitToHistory: boolean = true,
        oldValue: Point2D = clonePropertyValue(property.getter()),
    ): boolean => {
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
                if (commitToHistory) {
                    const result = executeUpdatePropertyCommand(property, oldValue, value);

                    if (result.status === Result.Status.Error) {
                        setError(result.message ?? null);
                        if (resetOnReject) resetDraft();
                        return false;
                    }

                    setDraft(toDraftValue(property.getter()));
                    return true;
                }

                previewUpdateProperty(property, value, "Point2DPropertyEditor");
                setDraft(toDraftValue(value));
                return true;
        }
    }, [property, resetDraft]);

    const applyAxisValue = useCallback((
        axis: keyof Point2D,
        rawValue: number,
        resetOnReject: boolean,
        commitToHistory: boolean = true,
        oldValue?: Point2D,
    ): boolean => {
        const currentValue = property.getter();

        const nextValue: Point2D = {
            x: currentValue.x,
            y: currentValue.y,
            [axis]: normalizeNumber(rawValue, undefined),
        };

        return applyPointValue(nextValue, resetOnReject, commitToHistory, oldValue);
    }, [property, applyPointValue]);

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

        applyPointValue(toPointValue(nextDraft), true);
    }, [applyPointValue, resetDraft]);

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

    const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
        const nextFocusedElement = event.relatedTarget;
    
        if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
            return;
        }
    
        isEditingRef.current = false;
        handleConfirmChange(draft);
    }, [draft, handleConfirmChange]);

    const handleAxisDragStart = useCallback(() => {
        dragStartValueRef.current = clonePropertyValue(property.getter());
    }, [property]);

    const handleAxisDragEnd = useCallback(() => {
        const oldValue = dragStartValueRef.current;

        if (!oldValue) {
            setError(null);
            resetDraft();
            return;
        }

        const newValue = clonePropertyValue(property.getter());
        dragStartValueRef.current = null;
        previewUpdateProperty(property, oldValue, "Point2DPropertyEditor");

        applyPointValue(newValue, true, true, oldValue);

        setError(null);
        resetDraft();
    }, [property, applyPointValue, resetDraft]);

    return (
        <VStack className="px-2">
            <div className="flex h-8 items-center gap-2" onClick={toggleOpen}>
                <ChevronUp size={14} className={`${isOpen ? "rotate-180" : "rotate-90"} duration-50`} />

                <Label title={property.label} className="text-2xs min-w-0 truncate">
                    <LocalizedText message={property.label} />
                </Label>
            </div>

            {isOpen && (
                <HStack className="gap-2 pb-2" onBlur={handleBlur}>
                    <PointAxisInput
                        axis="x"
                        label={property.pointLabel.x}
                        value={draft.x}
                        disabled={disabled}
                        readOnly={property.readonly()}
                        getValue={() => toFiniteNumber(property.getter().x)}
                        onDragStart={handleAxisDragStart}
                        onDragValueChange={(value) => applyAxisValue("x", value, false, false)}
                        onDragEnd={handleAxisDragEnd}
                        onChange={(event) => handleChange("x", event)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            isEditingRef.current = true;
                        }}
                    />

                    <PointAxisInput
                        axis="y"
                        label={property.pointLabel.y}
                        value={draft.y}
                        disabled={disabled}
                        readOnly={property.readonly()}
                        getValue={() => toFiniteNumber(property.getter().y)}
                        onDragStart={handleAxisDragStart}
                        onDragValueChange={(value) => applyAxisValue("y", value, false, false)}
                        onDragEnd={handleAxisDragEnd}
                        onChange={(event) => handleChange("y", event)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            isEditingRef.current = true;
                        }}
                    />
                </HStack>
            )}

            {error && (
                <span className="mt-1 pl-[calc(40%+0.5rem)] text-2xs text-destructive">
                    <LocalizedText message={error} />
                </span>
            )}
        </VStack>
    );
}

function PointAxisInput({
    label,
    value,
    disabled,
    readOnly,
    getValue,
    onFocus,
    onDragStart,
    onDragValueChange,
    onDragEnd,
    onChange,
    onKeyDown,
}: {
    axis: keyof Point2D;
    label: string;
    value: string;
    disabled: boolean;
    readOnly: boolean;
    getValue: () => number;
    onFocus: () => void;
    onDragStart: () => void;
    onDragValueChange: (value: number) => boolean | void;
    onDragEnd: () => void;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
    const { isDragging, dragProps } = useHorizontalNumberDrag({
        disabled,
        getValue,
        onDragStart,
        onValueChange: onDragValueChange,
        onDragEnd,
        wrapCursor: true,
    });

    return (
        <div className="flex w-full items-center gap-1">
            <span
                {...dragProps}
                className={[
                    "min-w-6 max-w-20 shrink-0 truncate text-[10px] text-shadow-foreground select-none",
                    disabled ? "cursor-default" : "cursor-ew-resize",
                    isDragging ? "text-primary" : "",
                ].join(" ")}
                title={label}
            >
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
                onFocus={onFocus}
            />
        </div>
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
