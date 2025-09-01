import { Application } from "pixi.js";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

import { Application as PixiCanvas } from "@pixi/react";

interface CanvasProps extends React.HTMLAttributes<HTMLDivElement> {
    initCanvas?: (app: Application) => void;
}

export default function Canvas({ initCanvas, className, children, ...props }: CanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mergedClassName = twMerge("overflow-hidden", className);
    
	return (
		<div ref={containerRef} className={mergedClassName} {...props}>
			<PixiCanvas resizeTo={containerRef} backgroundAlpha={0} autoStart sharedTicker onInit={initCanvas}>
                {children}
			</PixiCanvas>
		</div>
	);
}
