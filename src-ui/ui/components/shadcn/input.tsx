import * as React from "react";

import { cn } from "./utils/shadcn-utils";

function Input({ className: customClassName, type, ...props }: React.ComponentProps<"input">) {
    const dataClassName = "dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 file:h-6 file:text-xs file:font-medium focus-visible:ring-1 aria-invalid:ring-1 file:text-foreground placeholder:text-muted-foreground file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";
    const className = "border-foreground/40 h-8 rounded-none border bg-surface-sunken px-2.5 py-1 text-xs transition-colors md:text-xs w-full min-w-0 outline-none";

    return (
        <input
            type={type}
            data-slot="input"
            className={cn(dataClassName, className, customClassName)}
            autoComplete="off"
            {...props}
        />
    );
}

export { Input };
