"use client";

import { Label as LabelPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "./utils/shadcn-utils";

function Label({ className: customClassName, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
	const dataClassName = "group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed";
	const className = "gap-2 text-xs leading-none flex items-center select-none";
	return <LabelPrimitive.Root data-slot="label" className={cn(dataClassName, className, customClassName)} {...props} />;
}

export { Label };
