"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/view/components/shadcn/dialog"
import {
	InputGroup,
	InputGroupAddon,
} from "@/view/components/shadcn/input-group"
import { SearchIcon, CheckIcon } from "lucide-react"
import { cn } from "./utils/shadcn-utils"

function Command({ className: customClassName, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
	const dataClassName = "";
	const className = "flex size-full flex-col overflow-hidden rounded-none bg-surface-overlay text-foreground";
	return <CommandPrimitive data-slot="command" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function CommandDialog({
	title = "Command Palette",
	description = "Search for a command to run...",
	children,
	className: customClassName,
	showCloseButton = false,
	...props
}: React.ComponentProps<typeof Dialog> & {
	title?: string
	description?: string
	className?: string
	showCloseButton?: boolean
}) {
	const dataClassName = "";
	const className = "top-1/3 translate-y-0 overflow-hidden rounded-none p-0 bg-surface-overlay";
	return (
		<Dialog {...props}>
			<DialogHeader className="sr-only">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogContent
				className={cn(dataClassName, className, customClassName)}
				showCloseButton={showCloseButton}
			>
				{children}
			</DialogContent>
		</Dialog>
	)
}

function CommandInput({ className: customClassName, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
	const dataClassName = "disabled:cursor-not-allowed disabled:opacity-50";
	const className = "w-full text-xs outline-hidden";
	return (
		<div data-slot="command-input-wrapper" className="border-b pb-0">
			<InputGroup className="h-8 border-none border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
				<CommandPrimitive.Input
					data-slot="command-input"
					className={cn(dataClassName, className, customClassName)}
					{...props}
				/>
				<InputGroupAddon>
					<SearchIcon className="size-4 shrink-0 opacity-50" />
				</InputGroupAddon>
			</InputGroup>
		</div>
	)
}

function CommandList({ className: customClassName, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
	const dataClassName = "";
	const className = "no-scrollbar max-h-72 scroll-py-0 overflow-x-hidden overflow-y-auto outline-none";
	return <CommandPrimitive.List data-slot="command-list" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function CommandEmpty({ className: customClassName, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	const dataClassName = "";
	const className = "py-6 text-center text-xs";
	return <CommandPrimitive.Empty data-slot="command-empty" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function CommandGroup({ className: customClassName, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
	const dataClassName = "**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:text-muted-foreground";
	const className = "overflow-hidden text-foreground";
	return <CommandPrimitive.Group data-slot="command-group" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function CommandSeparator({ className: customClassName, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	const dataClassName = "";
	const className = "-mx-1 h-px bg-foreground/20";
	return <CommandPrimitive.Separator data-slot="command-separator" className={cn(dataClassName, className, customClassName)} {...props} />;

}

function CommandItem({ className: customClassName, children, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
	const dataClassName = "group/command-item in-data-[slot=dialog-content]:rounded-none! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground";
	const className = "relative flex cursor-default items-center gap-2 rounded-none px-2 py-2 text-xs outline-hidden select-none";
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(dataClassName, className, customClassName)}
			{...props}
		>
			{children}
			<CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
		</CommandPrimitive.Item>
	)
}

function CommandShortcut({ className: customClassName, ...props }: React.ComponentProps<"span">) {
	const dataClassName = "group-data-selected/command-item:text-foreground";
	const className = "ml-auto text-xs tracking-widest text-muted-foreground";
	return <span data-slot="command-shortcut" className={cn(dataClassName, className, customClassName)} {...props} />;
}

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
}
