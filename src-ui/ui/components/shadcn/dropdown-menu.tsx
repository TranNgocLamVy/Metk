"use client";

import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "./utils/shadcn-utils";

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
	return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
	return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
	return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({ className: customClassName, align = "start", sideOffset = 4, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	const dataClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden";
	const className = "bg-surface text-foreground min-w-40 rounded-none shadow-lg duration-100 z-50 w-(--radix-dropdown-menu-trigger-width) origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto";
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				data-slot="dropdown-menu-content"
				sideOffset={sideOffset}
				align={align}
				className={cn(dataClassName, className, customClassName)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
	return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
	className: customClassName,
	inset,
	variant = "default",
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) {
	const dataClassName = "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0";
	const className = "gap-2 rounded-none px-2 py-2 text-foreground text-xs h-7 relative flex cursor-default items-center outline-hidden select-none focus:bg-accent focus:text-accent-foreground";
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-inset={inset}
			data-variant={variant}
			className={cn(dataClassName, className, customClassName)}
			{...props}
		/>
	);
}

function DropdownMenuCheckboxItem({ className: customClassName, children, checked, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
	const dataClassName = "focus:**:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";
	const className = "gap-2 rounded-none py-2 pr-8 pl-2 text-foreground text-xs relative flex cursor-default items-center outline-hidden select-none focus:bg-accent focus:text-accent-foreground";
	return (
		<DropdownMenuPrimitive.CheckboxItem
			data-slot="dropdown-menu-checkbox-item"
			className={cn(dataClassName, className, customClassName)}
			checked={checked}
			{...props}>
			<span className="pointer-events-none absolute right-2 flex items-center justify-center" data-slot="dropdown-menu-checkbox-item-indicator">
				<DropdownMenuPrimitive.ItemIndicator>
					<CheckIcon />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	);
}

function DropdownMenuRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
	return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({ className: customClassName, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
	const dataClassName = "focus:**:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";
	const className = "gap-2 rounded-none py-2 pr-8 pl-2 text-foreground text-xs relative flex cursor-default items-center outline-hidden select-none focus:bg-accent focus:text-accent-foreground";
	return (
		<DropdownMenuPrimitive.RadioItem
			data-slot="dropdown-menu-radio-item"
			className={cn(dataClassName, className, customClassName)}
			{...props}>
			<span className="pointer-events-none absolute right-2 flex items-center justify-center" data-slot="dropdown-menu-radio-item-indicator">
				<DropdownMenuPrimitive.ItemIndicator>
					<CheckIcon />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.RadioItem>
	);
}

function DropdownMenuLabel({
	className: customClassName,
	inset,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
	inset?: boolean;
}) {
	const dataClassName = "data-[inset]:pl-8";
	const className = "text-muted-foreground px-2 py-2 text-xs";
	return <DropdownMenuPrimitive.Label data-slot="dropdown-menu-label" data-inset={inset} className={cn(dataClassName, className, customClassName)} {...props} />;
}

function DropdownMenuSeparator({ className: customClassName, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	const dataClassName = "";
	const className = "bg-foreground/20 -mx-1 h-px";
	return <DropdownMenuPrimitive.Separator data-slot="dropdown-menu-separator" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function DropdownMenuShortcut({ className: customClassName, ...props }: React.ComponentProps<"span">) {
	const dataClassName = "group-focus/dropdown-menu-item:text-accent-foreground";
	const className = "text-muted-foreground ml-auto text-xs tracking-widest";
	return <span data-slot="dropdown-menu-shortcut" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
	return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
	className: customClassName,
	inset,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
	inset?: boolean;
}) {
	const dataClassName = "data-open:bg-accent data-open:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0";
	const className = "gap-2 rounded-none px-2 py-2 text-foreground text-xs flex cursor-default items-center outline-hidden select-none focus:bg-accent focus:text-accent-foreground";
	return (
		<DropdownMenuPrimitive.SubTrigger
			data-slot="dropdown-menu-sub-trigger"
			data-inset={inset}
			className={cn(dataClassName, className, customClassName)}
			{...props}>
			{children}
			<ChevronRightIcon className="ml-auto" />
		</DropdownMenuPrimitive.SubTrigger>
	);
}

function DropdownMenuSubContent({ className: customClassName, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
	const dataClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
	const className = "bg-surface text-foreground min-w-[96px] rounded-none shadow-lg duration-100 z-50 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden";
	return (
		<DropdownMenuPrimitive.SubContent
			data-slot="dropdown-menu-sub-content"
			className={cn(dataClassName, className, customClassName)}
			{...props}
		/>
	);
}

export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger };

