import type { PointerEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { NativeCursorService } from "@/infrastructure/gateways/native-cursor";

type DragState = {
    pointerId: number;
    value: number;
    accumulatedPixels: number;
};

export type NumberDragOptions = {
    disabled?: boolean;
    precision?: number;
    min?: number;
    max?: number;
    pixelsPerStep?: number;
    wrapCursor?: boolean;
    hideCursorWhileDragging?: boolean;
    getValue: () => number;
    onValueChange: (value: number) => boolean | void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
};

const DEFAULT_PIXELS_PER_STEP = 4;
const EDGE_MARGIN = 8;
const SAFE_MARGIN = 24;

export function useHorizontalNumberDrag(options: NumberDragOptions) {
    const {
        disabled = false,
        precision,
        min,
        max,
        pixelsPerStep = DEFAULT_PIXELS_PER_STEP,
        wrapCursor = false,
        hideCursorWhileDragging = false,
        getValue,
        onValueChange,
        onDragStart,
        onDragEnd,
    } = options;

    const [isDragging, setIsDragging] = useState(false);

    const dragStateRef = useRef<DragState | null>(null);

    const ignoreNextMoveRef = useRef(false);

    const handlePointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
        if (disabled) return;

        event.preventDefault();
        event.stopPropagation();

        const startValue = toFiniteNumber(getValue());

        dragStateRef.current = {
            pointerId: event.pointerId,
            value: startValue,
            accumulatedPixels: 0,
        };

        ignoreNextMoveRef.current = false;

        event.currentTarget.setPointerCapture(event.pointerId);

        setIsDragging(true);
        onDragStart?.();

        if (hideCursorWhileDragging) {
            void NativeCursorService.setVisible(false);
        }
    }, [
        disabled,
        getValue,
        hideCursorWhileDragging,
        onDragStart,
    ]);

    const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;

        event.preventDefault();
        event.stopPropagation();

        if (ignoreNextMoveRef.current) {
            ignoreNextMoveRef.current = false;
            return;
        }

        const movementX = getSafeMovementX(event);
        if (movementX === 0) {
            maybeWrapCursor(event, wrapCursor, ignoreNextMoveRef);
            return;
        }

        dragState.accumulatedPixels += movementX;

        const step = getDragStep(precision, event);
        const valueDelta = (dragState.accumulatedPixels / pixelsPerStep) * step;

        const nextValue = normalizeNumber(
            clampNumber(dragState.value + valueDelta, min, max),
            precision,
        );

        if (!Object.is(nextValue, dragState.value)) {
            const applied = onValueChange(nextValue);

            if (applied !== false) {
                dragState.value = nextValue;
                dragState.accumulatedPixels = 0;
            }
        }

        maybeWrapCursor(event, wrapCursor, ignoreNextMoveRef);
    }, [
        precision,
        pixelsPerStep,
        min,
        max,
        wrapCursor,
        onValueChange,
    ]);

    const finishDrag = useCallback((event: PointerEvent<HTMLElement>) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;

        event.preventDefault();
        event.stopPropagation();

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        dragStateRef.current = null;
        ignoreNextMoveRef.current = false;

        setIsDragging(false);
        onDragEnd?.();

        if (hideCursorWhileDragging) {
            void NativeCursorService.setVisible(true);
        }
    }, [
        hideCursorWhileDragging,
        onDragEnd,
    ]);

    return {
        isDragging,
        dragProps: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: finishDrag,
            onPointerCancel: finishDrag,
        },
    };
}

function maybeWrapCursor(
    event: PointerEvent<HTMLElement>,
    enabled: boolean,
    ignoreNextMoveRef: React.MutableRefObject<boolean>,
): void {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const y = event.clientY;

    if (event.clientX <= EDGE_MARGIN) {
        ignoreNextMoveRef.current = true;
        void NativeCursorService.setPosition(window.innerWidth - SAFE_MARGIN, y);
        return;
    }

    if (event.clientX >= window.innerWidth - EDGE_MARGIN) {
        ignoreNextMoveRef.current = true;
        void NativeCursorService.setPosition(SAFE_MARGIN, y);
    }
}

function getSafeMovementX(event: PointerEvent<HTMLElement>): number {
    const movementX = event.movementX;

    if (!Number.isFinite(movementX)) {
        return 0;
    }
    
    if (Math.abs(movementX) > 200) {
        return 0;
    }

    return movementX;
}

export function isAllowedNumberDraft(rawValue: string): boolean {
    return (
        rawValue === "" ||
        rawValue === "-" ||
        rawValue === "+" ||
        !Number.isNaN(Number(rawValue))
    );
}

export function isCompleteNumberInput(rawValue: string): boolean {
    if (rawValue.trim() === "") return false;
    if (rawValue === "-" || rawValue === "+") return false;
    if (rawValue.endsWith(".")) return false;

    return Number.isFinite(Number(rawValue));
}

export function getDecimalPlaces(rawValue: string): number {
    const normalized = rawValue.toLowerCase();

    if (normalized.includes("e")) {
        const value = Number(normalized);
        if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;

        const [, exponentPart] = normalized.split("e");
        const exponent = Number(exponentPart);
        const mantissaDecimalPlaces =
            normalized.split("e")[0].split(".")[1]?.length ?? 0;

        return Math.max(0, mantissaDecimalPlaces - exponent);
    }

    return normalized.split(".")[1]?.length ?? 0;
}

export function matchesPrecision(rawValue: string, precision: number | undefined): boolean {
    if (precision === undefined) return true;
    if (!Number.isInteger(precision) || precision < 0) return true;

    return getDecimalPlaces(rawValue) <= precision;
}

export function getStepFromPrecision(precision: number | undefined): number {
    if (precision === undefined) return 1;
    if (!Number.isInteger(precision) || precision < 0) return 1;

    return 1 / 10 ** precision;
}

export function normalizeNumber(value: number, precision: number | undefined): number {
    if (!Number.isFinite(value)) return 0;

    if (precision === undefined) return value;
    if (!Number.isInteger(precision) || precision < 0) return value;

    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
}

export function clampNumber(value: number, min?: number, max?: number): number {
    let result = value;

    if (typeof min === "number") {
        result = Math.max(min, result);
    }

    if (typeof max === "number") {
        result = Math.min(max, result);
    }

    return result;
}

export function toFiniteNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function getDragStep(
    precision: number | undefined,
    event: PointerEvent<HTMLElement>,
): number {
    const baseStep = getStepFromPrecision(precision);

    if (event.shiftKey) return baseStep * 10;
    if (event.altKey) return baseStep * 0.1;

    return baseStep;
}