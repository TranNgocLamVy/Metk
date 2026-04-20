import { Info, TriangleAlert } from "lucide-react";
import { HStack } from "../custom/stack/Stack";
import { Button } from "../shadcn/button";
import { useTerminalStore } from "@/view/stores/terminalStore";

export default function ContextBar() {
    const { toggleWithType } = useTerminalStore();

    return (
        <HStack align="center" className="w-full h-8 bg-surface-base">
            <HStack justify="center" align="center" className="gap-1">
                <Button variant={"ghost"} className="h-6 w-fit [&_svg:not([class*='size-'])]:size-3" onClick={() => toggleWithType("log")}>
                    0 
                    <Info />
                </Button>
                <Button variant={"ghost"} className="text-destructive h-6 w-fit [&_svg:not([class*='size-'])]:size-3" onClick={() => toggleWithType("error")}>
                    0
                    <TriangleAlert />
                </Button>
            </HStack>
        </HStack>
    )
}