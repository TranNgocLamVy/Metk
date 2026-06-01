import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NumberPropertyClass } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Label } from "@/ui/components/shadcn/label";
import { Slider } from "@/ui/components/shadcn/slider";
import { usePropertyStoreVersion } from "@/ui/stores/property.store";
import { clonePropertyValue, executeUpdatePropertyCommand, previewUpdateProperty } from "./property-command.utils";

export interface SliderEditorProps {
    property: NumberPropertyClass<any>;
    slider: {
        range: [number, number];
        step: number;
        interactive?: boolean;
    };
}

export function SliderPropertyEditor({ property, slider }: SliderEditorProps) {
    const version = usePropertyStoreVersion();

    const [draft, setDraft] = useState<number>(property.getter());
    const commitStartValueRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);

    const interactive = useMemo(() => slider.interactive ?? true, [slider]);
    const precision = useMemo(() => property.precision ?? 2, [property]);

    useEffect(() => {
        if (isDraggingRef.current) return;

        setDraft(property.getter());
    }, [property, version]);

    const captureCommitStartValue = useCallback(() => {
        if (commitStartValueRef.current !== null) return;

        commitStartValueRef.current = clonePropertyValue(property.getter());
    }, [property]);

    const handleSliderChange = useCallback((values: number[]) => {
        isDraggingRef.current = true;
        captureCommitStartValue();

        const nextValue = values[0] ?? Number.NaN;
        const normalizedValue = Number(nextValue.toFixed(precision));

        setDraft(normalizedValue);

        const result = property.validate(normalizedValue);

        if (interactive && result.status === Result.Status.Success) {
            previewUpdateProperty(property, normalizedValue, "SliderPropertyEditor");
        }
    }, [captureCommitStartValue, interactive, precision, property]);

    const handleSliderCommit = useCallback((values: number[]) => {
        const nextValue = values[0] ?? Number.NaN;
        const normalizedValue = Number(nextValue.toFixed(precision));

        const validateResult = property.validate(normalizedValue);

        if (validateResult.status !== Result.Status.Success) {
            commitStartValueRef.current = null;
            setDraft(property.getter());
            isDraggingRef.current = false;
            return;
        }

        const oldValue = commitStartValueRef.current ?? clonePropertyValue(property.getter());
        commitStartValueRef.current = null;
        previewUpdateProperty(property, oldValue, "SliderPropertyEditor");

        executeUpdatePropertyCommand(property, oldValue, normalizedValue);
        setDraft(property.getter());
        isDraggingRef.current = false;
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
                    onPointerDownCapture={() => {
                        isDraggingRef.current = true;
                        captureCommitStartValue();
                    }}
                    onValueChange={handleSliderChange}
                    onValueCommit={handleSliderCommit}
                    className="min-w-20 flex-1"
                />
            </HStack>
        </div>
    );
}
