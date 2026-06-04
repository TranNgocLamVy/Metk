import { twMerge } from "tailwind-merge";
import { VStack } from "../custom/stack/Stack";

type Props = {
    children: React.ReactNode;
    className?: string;
}

export default function PanelContainer({ children, className }: Props) {
    const mergeClassName = twMerge(className, "w-full h-full bg-surface relative")
    return (
        <VStack className={mergeClassName}>
            <div className="flex absolute top-0 left-0 right-0 bottom-0 pointer-events-none pb-frame-half px-frame-quarter">
                <div className="w-full h-full border border-t-0 border-foreground/30 z-10 shadow-md" />
            </div>
            {children}
        </VStack>
    )
}