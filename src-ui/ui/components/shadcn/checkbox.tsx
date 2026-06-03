import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "./utils/shadcn-utils";

function Checkbox({ className: customClassName, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    const dataClassName = "dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 group-has-disabled/field:opacity-50 focus-visible:ring-1 aria-invalid:ring-1 after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50";
    const className = "flex size-4 items-center justify-center rounded-none border border-foreground/30 bg-surface-sunken transition-colors peer relative shrink-0 outline-none";
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(dataClassName, className, customClassName)}
            {...props}
        >
            <CheckboxPrimitive.Indicator 
                data-slot="checkbox-indicator" 
                className={cn(
                    "[&>svg]:size-3.5", // dataClassName equivalent 
                    "grid place-content-center text-current transition-none" // className equivalent
                )}
            >
                <CheckIcon />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };

