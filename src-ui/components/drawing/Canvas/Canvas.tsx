import { Application } from "@pixi/react";
import { useRef } from "react"
import { twMerge } from "tailwind-merge";

interface CanvasProps extends React.HTMLAttributes<HTMLDivElement> { }

export default function Canvas({ className, children, ...props }: CanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mergedClassName = twMerge("overflow-hidden", className);
	return (
		<div ref={containerRef} className={mergedClassName} {...props}>
			<Application resizeTo={containerRef} backgroundAlpha={0} autoStart sharedTicker>
                {children}
			</Application>
		</div>
	);
}
