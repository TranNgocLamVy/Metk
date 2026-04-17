"use client";

import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import * as React from "react";

import { Button } from "./button";
import { cn } from "./utils/shadcn-utils";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className: customClassName, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	const dataClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0";
	const className = "bg-black/30 duration-100 fixed inset-0 isolate z-50";
	return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function DialogContent({
	className: customClassName,
	children,
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
}) {
	const dataClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 focus:outline-none";
	const className = "bg-surface-overlay grid gap-4 rounded-none p-4 text-foreground text-xs/relaxed duration-100 fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2";
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(dataClassName, className, customClassName)}
				{...props}>
				{children}
				{showCloseButton && (
					<DialogPrimitive.Close data-slot="dialog-close" asChild>
						<Button variant="ghost" className="absolute top-2 right-2" size="icon-sm">
							<XIcon />
							<span className="sr-only">Close</span>
						</Button>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className: customClassName, ...props }: React.ComponentProps<"div">) {
	const dataClassName = "";
	const className = "gap-1 text-left flex flex-col";
	return <div data-slot="dialog-header" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function DialogFooter({
	className: customClassName,
	showCloseButton = false,
	children,
	...props
}: React.ComponentProps<"div"> & {
	showCloseButton?: boolean;
}) {
	const dataClassName = "";
	const className = "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";
	return (
		<div data-slot="dialog-footer" className={cn(dataClassName, className, customClassName)} {...props}>
			{children}
			{showCloseButton && (
				<DialogPrimitive.Close asChild>
					<Button variant="outline">Close</Button>
				</DialogPrimitive.Close>
			)}
		</div>
	);
}

function DialogTitle({ className: customClassName, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	const dataClassName = "";
	const className = "text-sm font-bold";
	return <DialogPrimitive.Title data-slot="dialog-title" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function DialogDescription({ className: customClassName, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
	const dataClassName = "*:[a]:hover:text-foreground *:[a]:underline *:[a]:underline-offset-3";
	const className = "text-muted-foreground text-xs/relaxed";
	return <DialogPrimitive.Description data-slot="dialog-description" className={cn(dataClassName, className, customClassName)} {...props} />;
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
