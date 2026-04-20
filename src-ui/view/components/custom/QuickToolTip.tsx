import { Tooltip, TooltipContent, TooltipTrigger } from "../shadcn/tooltip";



type Props = {
    children: React.ReactNode;
    toolTip: string;
    delayDuration?: number;
}

export default function QuickToolTip({ children, toolTip, delayDuration }: Props) {
    return (
        <Tooltip delayDuration={delayDuration ?? 500} >
            <TooltipTrigger asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="w-fit text-xs bg-surface-overlay-sunken shadow-md">{toolTip}</TooltipContent>
        </Tooltip>
    )
}