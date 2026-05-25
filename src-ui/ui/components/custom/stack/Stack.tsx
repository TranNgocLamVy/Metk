import { CSSProperties, LegacyRef, ReactNode } from "react";

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
	align?: CSSProperties["alignItems"];
	justify?: CSSProperties["justifyContent"];
	style?: CSSProperties;
	className?: string;
	ref?: LegacyRef<HTMLDivElement> | undefined
}

export function VStack({ children, align = "stretch", justify = "flex-start", style, className, ...props }: StackProps) {
	return (
		<div
			{...props}
			className={className}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: align,
				justifyContent: justify,
				...style,
			}}>
			{children}
		</div>
	);
}


export function HStack({ children, align = "stretch", justify = "flex-start", style, className, ...props }: StackProps) {
    return (
        <div
            {...props}
            className={className}
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: align,
                justifyContent: justify,
                ...style,
            }}>
            {children}
        </div>
    );
}
