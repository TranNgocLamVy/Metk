import { useCallback, useMemo, useRef, useState } from "react";

import { NumberPropertyClass } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";

import { LocalizedText } from "../custom/LocalizeText";
import { HStack } from "../custom/stack/Stack";
import { Label } from "../shadcn/label";
import { Slider } from "../shadcn/slider";
import { clonePropertyValue, executeUpdatePropertyCommand } from "./property-command.utils";

export interface SliderEditorProps {
    property: NumberPropertyClass<any>;
    slider: {
        range: [number, number];
        step: number;
        interactive?: boolean;
    };
}

export function SliderPropertyEditor({ property, slider }: SliderEditorProps) {
    const [draft, setDraft] = useState<number>(property.getter());
    const commitStartValueRef = useRef<number | null>(null);

    const interactive = useMemo(() => slider.interactive ?? true, [slider]);
    const precision = useMemo(() => property.precision ?? 2, [property]);

    const captureCommitStartValue = useCallback(() => {
        if (commitStartValueRef.current !== null) return;

        commitStartValueRef.current = clonePropertyValue(property.getter());
    }, [property]);

    const handleSliderChange = useCallback((values: number[]) => {
        captureCommitStartValue();

        const nextValue = values[0] ?? Number.NaN;
        const normalizedValue = Number(nextValue.toFixed(precision));

        setDraft(normalizedValue);

        const result = property.validate(normalizedValue);

        if (interactive && result.status === Result.Status.Success) {
            property.setter(normalizedValue);
        }
    }, [captureCommitStartValue, interactive, precision, property]);

    const handleSliderCommit = useCallback((values: number[]) => {
        const nextValue = values[0] ?? Number.NaN;
        const normalizedValue = Number(nextValue.toFixed(precision));

        const validateResult = property.validate(normalizedValue);

        if (validateResult.status !== Result.Status.Success) {
            commitStartValueRef.current = null;
            setDraft(property.getter());
            return;
        }

        const oldValue = commitStartValueRef.current ?? clonePropertyValue(property.getter());
        commitStartValueRef.current = null;
        property.setter(oldValue);

        executeUpdatePropertyCommand(property, oldValue, normalizedValue);
        setDraft(property.getter());
    }, [precision, property]);

    return (
        <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] px-2 h-8 items-center gap-2">
            <Label title={property.label} className="text-2xs min-w-0 truncate">
                <LocalizedText message={property.label} />
            </Label>

            <HStack className="gap-2">
                <span className="text-2xs text-foreground">
                    {draft.toFixed(precision)}
                </span>

                <Slider
                    value={[draft]}
                    min={slider.range[0]}
                    max={slider.range[1]}
                    step={slider.step}
                    disabled={property.disabled() || property.readonly()}
                    onPointerDownCapture={captureCommitStartValue}
                    onValueChange={handleSliderChange}
                    onValueCommit={handleSliderCommit}
                    className="min-w-20 flex-1"
                />
            </HStack>
        </div>
    );
}