import { CSSProperties, ReactNode } from "react";

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	gap?: number | string;
	align?: CSSProperties["alignItems"];
	justify?: CSSProperties["justifyContent"];
	style?: CSSProperties;
	className?: string;
}

export function VStack({ children, gap = "1rem", align = "stretch", justify = "flex-start", style, className, ...props }: StackProps) {
	return (
		<div
			{...props}
			className={className}
			style={{
				display: "flex",
				flexDirection: "column",
				gap,
				alignItems: align,
				justifyContent: justify,
				...style,
			}}>
			{children}
		</div>
	);
}


export function HStack({ children, gap = "1rem", align = "stretch", justify = "flex-start", style, className, ...props }: StackProps) {
    return (
        <div
            {...props}
            className={className}
            style={{
                display: "flex",
                flexDirection: "row",
                gap,
                alignItems: align,
                justifyContent: justify,
                ...style,
            }}>
            {children}
        </div>
    );
}
