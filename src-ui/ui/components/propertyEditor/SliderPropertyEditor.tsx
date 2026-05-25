import { useMemo, useState } from "react";

import { NumberPropertyClass } from "@/editor/properties/properties";
import { Slider } from "../shadcn/slider";
import { HStack } from "../custom/stack/Stack";
import { Result } from "@/shared/types/result";

export interface SliderEditorProps {
    property: NumberPropertyClass<any>;
    slider: { range: [number, number]; step: number, interactive?: boolean }
}

export function SliderPropertyEditor({ property, slider }: SliderEditorProps) {
    const [draft, setDraft] = useState<number>(property.getter());

    const interactive = useMemo(() => slider.interactive ?? true, [slider]);

    const precision = useMemo(() => property.precision ?? 2, [property]);

    const handleSliderChange = (values: number[]) => {
        const nextValue = values[0] ?? Number.NaN;
        setDraft(nextValue);

        const result = property.validate(nextValue);
        if (interactive && result.status === Result.Status.Success) property.setter(Number(nextValue.toFixed(precision)));
    };

    const handleSliderCommit = (values: number[]) => {
        const nextValue = values[0] ?? Number.NaN;
        const result = property.validate(nextValue);
        if (result.status == Result.Status.Success) {
            property.setter(Number(nextValue.toFixed(precision)));
            setDraft(property.getter());
        }
    };

    return (
        <div className="grid grid-cols-[minmax(84px,40%)_minmax(0,1fr)] px-2 h-8 items-center gap-2">
            <label className="min-w-0 truncate text-2xs text-shadow-foreground" title={property.label}>
                {property.label}
            </label>
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
                    onValueChange={handleSliderChange}
                    onValueCommit={handleSliderCommit}
                    className="min-w-20 flex-1"
                />
            </HStack>
        </div>
    )
}