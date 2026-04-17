"use client";

import { Check, CheckIcon, ChevronRightIcon, Square, SquareCheckBig } from "lucide-react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "./utils/shadcn-utils";

function ContextMenu({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
	return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({ className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
	return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" className={cn("select-none", className)} {...props} />;
}

function ContextMenuGroup({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
	return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

function ContextMenuPortal({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
	return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />;
}

function ContextMenuSub({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
	return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

function ContextMenuRadioGroup({ ...props }: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
	return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

function ContextMenuContent({
	className: customClassName,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content> & {
	side?: "top" | "right" | "bottom" | "left";
}) {
	const dataClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
	const className = "min-w-36 rounded-none shadow-lg duration-100 z-50 origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto bg-surface-overlay";
	return (
		<ContextMenuPrimitive.Portal>
			<ContextMenuPrimitive.Content
				data-slot="context-menu-content"
				className={cn(dataClassName, className, customClassName)}
				{...props}
			/>
		</ContextMenuPrimitive.Portal>
	);
}

function ContextMenuItem({
	className: customClassName,
	inset,
	variant = "default",
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) {
	const dataClassName = "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive focus:*:[svg]:text-accent-foreground focus:bg-accent [&_svg:not([class*='size-'])]:size-4 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0";
	const className = "relative flex cursor-default items-center outline-hidden select-none text-foreground text-xs px-2 py-2 gap-2 rounded-none focus:bg-accent focus:text-accent-foreground group/context-menu-item";
	return (
		<ContextMenuPrimitive.Item
			data-slot="context-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(dataClassName, className, customClassName)}
			{...props}
		/>
	);
}

function ContextMenuSubTrigger({
	className: customClassName,
	inset,
	children,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
	inset?: boolean;
}) {
	const dataClassName = "data-open:bg-accent data-open:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0";
	const className = "gap-2 rounded-none px-2 py-2 text-foreground text-xs flex cursor-default items-center outline-hidden select-none focus:bg-accent focus:text-accent-foreground";
	return (
		<ContextMenuPrimitive.SubTrigger
			data-slot="context-menu-sub-trigger"
			data-inset={inset}
			className={cn(dataClassName, className, customClassName)}
			{...props}>
			{children}
			<ChevronRightIcon className="ml-auto" />
		</ContextMenuPrimitive.SubTrigger>
	);
}

function ContextMenuSubContent({ className: customClassName, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
	const dataClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
	const className = "bg-surface-overlay text-foreground min-w-32 rounded-none shadow-lg duration-100 z-50 origin-(--radix-context-menu-content-transform-origin) overflow-hidden";
	return (
		<ContextMenuPrimitive.SubContent
			data-slot="context-menu-sub-content"
			className={cn(dataClassName, className, customClassName)}
			{...props}
		/>
	);
}

function ContextMenuCheckboxItem({ className: customClassName, children, checked, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
	const dataClassName = "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";
	const className = "gap-2 rounded-none py-2 pr-8 pl-2 text-foreground text-xs relative flex cursor-default items-center outline-hidden select-none focus:bg-accent focus:text-accent-foreground";
	return (
		<ContextMenuPrimitive.CheckboxItem
			data-slot="context-menu-checkbox-item"
			className={cn(dataClassName, className, customClassName)}
			checked={checked}
			{...props}>
			<span className="absolute right-2 pointer-events-none">
				<ContextMenuPrimitive.ItemIndicator>
					<CheckIcon />
				</ContextMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</ContextMenuPrimitive.CheckboxItem>
	);
}

function ContextMenuRadioItem({ className: customClassName, children, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
	const dataClassName = "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";
	const className = "gap-2 rounded-none py-2 pr-8 pl-2 text-foreground text-xs relative flex cursor-default items-center outline-hidden select-none focus:bg-accent focus:text-accent-foreground";
	return (
		<ContextMenuPrimitive.RadioItem
			data-slot="context-menu-radio-item"
			className={cn(dataClassName, className, customClassName)}
			{...props}>
			<span className="absolute right-2 pointer-events-none">
				<ContextMenuPrimitive.ItemIndicator>
					<CheckIcon />
				</ContextMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</ContextMenuPrimitive.RadioItem>
	);
}

function ContextMenuLabel({
	className: customClassName,
	inset,
	...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
	inset?: boolean;
}) {
	const dataClassName = "data-[inset]:pl-8";
	const className = "text-muted-foreground px-2 py-2 text-xs";
	return <ContextMenuPrimitive.Label data-slot="context-menu-label" data-inset={inset} className={cn(dataClassName, className, customClassName)} {...props} />;
}

function ContextMenuSeparator({ className: customClassName, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
	const dataClassName = "";
	const className = "bg-foreground/20 -mx-1 h-px";
	return <ContextMenuPrimitive.Separator data-slot="context-menu-separator" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function ContextMenuShortcut({ className: customClassName, ...props }: React.ComponentProps<"span">) {
	const dataClassName = "group-focus/context-menu-item:text-accent-foreground";
	const className = "text-muted-foreground ml-auto text-xs tracking-widest";
	return <span data-slot="context-menu-shortcut" className={cn(dataClassName, className, customClassName)} {...props} />;
}

export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup };
