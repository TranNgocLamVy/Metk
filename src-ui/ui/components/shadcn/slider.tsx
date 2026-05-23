import { Slider as SliderPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "./utils/shadcn-utils";

function Slider({
    className,
    ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
    return (
        <SliderPrimitive.Root
            data-slot="slider"
            className={cn(
                "relative flex w-full touch-none items-center select-none data-disabled:opacity-50",
                className,
            )}
            {...props}
        >
            <SliderPrimitive.Track
                data-slot="slider-track"
                className="relative h-1.5 w-full grow overflow-hidden bg-surface-sunken"
            >
                <SliderPrimitive.Range
                    data-slot="slider-range"
                    className="absolute h-full bg-accent"
                />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
                data-slot="slider-thumb"
                className="block size-3 border border-foreground/40 bg-surface-raised outline-none transition-colors focus-visible:border-accent disabled:pointer-events-none disabled:opacity-50"
            />
        </SliderPrimitive.Root>
    );
}

export { Slider };