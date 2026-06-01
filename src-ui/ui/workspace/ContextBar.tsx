import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { useConsoleStore } from "@/ui/stores/console.store";
import { Info, TriangleAlert } from "lucide-react";

export default function ContextBar() {
    const { logs, errors, toggleWithType } = useConsoleStore();

    const lastLog = logs[logs.length - 1];
    const lastError = errors[errors.length - 1];

    return (
        <HStack align="center" className="w-full h-8 bg-surface-base px-2">
            <HStack align="center" className="gap-1 w-fit">
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
            <HStack align="center" justify="center" className="ml-auto text-xs">
                <span className="text-foreground">App is in early development stage, expect bugs and missing features. Report issues: </span>
                <a href="https://github.com/TranNgocLamVy/Metk/issues" target="_blank" rel="noopener noreferrer" className="text-accent underline ml-1" >
                    Here
                </a>
            </HStack>
        </HStack>
    );
}