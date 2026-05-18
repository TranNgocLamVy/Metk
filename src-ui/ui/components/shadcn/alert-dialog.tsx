import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { Button } from "./button";
import { cn } from "./utils/shadcn-utils";

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
	return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ className: customClassName, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
	const dataClassName = "";
    const className = "";
	return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} className={cn(dataClassName, className, customClassName )} />;
}

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
	return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({ className: customClassName, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
	const dataClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0";
	const className = "bg-black/20 duration-100 fixed inset-0 z-50"
	return <AlertDialogPrimitive.Overlay data-slot="alert-dialog-overlay" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function AlertDialogContent({ className: customClassName, size = "default", ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content> & { size?: "lg" | "default" | "sm" }) {
	const dataClassName = "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg";
	const className = "bg-surface-overlay ring-foreground/10 gap-4 rounded-none p-4 duration-100 group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 outline-none"
	return (
		<AlertDialogPortal>
			<AlertDialogOverlay />
			<AlertDialogPrimitive.Content data-slot="alert-dialog-content" data-size={size} className={cn(dataClassName, className, customClassName)} {...props} />
		</AlertDialogPortal>
	);
}

function AlertDialogHeader({ className: customClassName, ...props }: React.ComponentProps<"div">) {
	const dataClassName = "has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]";
	const className = "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center";
	return <div data-slot="alert-dialog-header" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function AlertDialogFooter({ className: customClassName, ...props }: React.ComponentProps<"div">) {
    const dataClassName = "group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2";
    const className = "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end";
    return <div data-slot="alert-dialog-footer" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function AlertDialogMedia({ className: customClassName, ...props }: React.ComponentProps<"div">) {
    const dataClassName = "sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6";
    const className = "bg-muted mb-2 inline-flex size-10 items-center justify-center rounded-none";
    return <div data-slot="alert-dialog-media" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function AlertDialogTitle({ className: customClassName, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
    const dataClassName = "sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2";
    const className = "text-sm text-foreground font-medium";
    return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function AlertDialogDescription({ className: customClassName, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
    const dataClassName = "*:[a]:hover:text-foreground *:[a]:underline *:[a]:underline-offset-3";
    const className = "text-muted-foreground text-xs/relaxed text-balance md:text-pretty";
    return <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={cn(dataClassName, className, customClassName)} {...props} />;
}

function AlertDialogAction({ className: customClassName, variant = "default", size = "default", ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action> & Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
    const dataClassName = "";
    const className = "";
    return (
        <Button variant={variant} size={size} asChild>
            <AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn(dataClassName, className, customClassName)} {...props} />
        </Button>
    );
}

function AlertDialogCancel({ className: customClassName, variant = "outline", size = "default", ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> & Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
    const dataClassName = "";
    const className = "";
    return (
        <Button variant={variant} size={size} asChild>
            <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(dataClassName, className, customClassName)} {...props} />
        </Button>
    );
}

export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger };
