import { Info, TriangleAlert } from "lucide-react";
import { HStack } from "../custom/stack/Stack";
import { Button } from "../shadcn/button";
import { useConsoleStore } from "@/view/stores/consoleStore";

export default function ContextBar() {
    const { logs, errors, toggleWithType } = useConsoleStore();

    return (
        <HStack align="center" className="w-full h-8 bg-surface-base">
            <HStack justify="center" align="center" className="gap-1">
                <Button variant={"ghost"} className="h-6 w-fit [&_svg:not([class*='size-'])]:size-3" onClick={() => toggleWithType("log")}>
                    <Info />
                    {logs.length}
                </Button>
                <Button variant={"ghost"} className="text-destructive h-6 w-fit [&_svg:not([class*='size-'])]:size-3" onClick={() => toggleWithType("error")}>
                    <TriangleAlert />
                    {errors.length}
                </Button>
            </HStack>
        </HStack>
    )
}