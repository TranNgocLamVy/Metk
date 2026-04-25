import { Tooltip, TooltipContent, TooltipTrigger } from "../shadcn/tooltip";
import { LocalizedText } from "./LocalizeText";



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
            <TooltipContent side="bottom" className="w-fit text-xs bg-surface-overlay-sunken shadow-md"><LocalizedText message={toolTip} /></TooltipContent>
        </Tooltip>
    )
}