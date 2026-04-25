import { Info, TriangleAlert } from "lucide-react";
import { HStack } from "../custom/stack/Stack";
import { Button } from "../shadcn/button";
import { useConsoleStore } from "@/view/stores/consoleStore";
import { LocalizedText } from "../custom/LocalizeText";

export default function ContextBar() {
    const { logs, errors, toggleWithType } = useConsoleStore();

    const lastLog = logs[logs.length - 1];
    const lastError = errors[errors.length - 1];

    return (
        <HStack align="center" className="w-full h-8 bg-surface-base px-2">
            <HStack align="center" className="gap-1 w-full">
                <HStack className="w-fit gap-1">
                    <Button variant={"ghost"} className="h-6 w-fit shrink-0 [&_svg:not([class*='size-'])]:size-3" onClick={() => toggleWithType("log")}>
                        <Info />
                        {logs.length}
                    </Button>
                    {lastLog && (
                        <HStack align="center" className="gap-2 max-w-100 overflow-hidden">
                            <span className="text-muted-foreground text-xs shrink-0 mt-0.5">
                                [{new Date(lastLog.timestamp).toLocaleTimeString()}]
                            </span>
                            <span className="text-foreground text-xs font-medium truncate">
                                <LocalizedText message={lastLog.message} />
                            </span>
                        </HStack>
                    )}
                </HStack>

                <HStack className="w-fit gap-1">
                    <Button variant={"ghost"} className="text-destructive h-6 w-fit shrink-0 [&_svg:not([class*='size-'])]:size-3" onClick={() => toggleWithType("error")}>
                        <TriangleAlert />
                        {errors.length}
                    </Button>
                    {lastError && (
                        <HStack align="center" className="gap-2 max-w-100 overflow-hidden">
                            <span className="text-muted-foreground text-xs shrink-0 mt-0.5">
                                [{new Date(lastError.timestamp).toLocaleTimeString()}]
                            </span>
                            <span className="text-destructive text-xs font-medium truncate">
                                {lastError.message && <LocalizedText message={lastError.message} />}
                            </span>
                        </HStack>
                    )}
                </HStack>

            </HStack>
        </HStack>
    );
}