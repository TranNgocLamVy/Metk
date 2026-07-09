import { Result } from "@/shared/types/result";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { ScrollArea } from "@/ui/components/shadcn/scroll-area";
import { useConsoleActions, useConsoleLogs } from "@/ui/stores/console.store";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function LogConsole() {
    const logs = useConsoleLogs();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [logs.length]);

    return (
        <ScrollArea className="h-full w-full">
            <VStack className="w-full gap-0">
                {logs.map((log) => (
                    <LogItem key={log.id} log={log} />
                ))}

                {logs.length === 0 && (
                    <div className="w-full text-center p-4 text-muted-foreground text-sm">
                        <LocalizedText message="console.empty.logs" />
                    </div>
                )}
                <div ref={bottomRef} className="h-1" />
            </VStack>
        </ScrollArea>
    );
}

function LogItem({ log }: { log: any }) {
    const { removeLog } = useConsoleActions();

    return (
        <VStack className="w-full p-2 text-sm hover:bg-foreground/5">
            <HStack align="start" className="gap-2">
                <div className="mt-0.5 shrink-0">
                    {log.level === "info" && <Info size={14} className="text-blue-500" />}
                    {log.level === "success" && <CheckCircle2 size={14} className="text-green-500" />}
                    {log.level === "warning" && <AlertTriangle size={14} className="text-yellow-500" />}
                </div>

                <VStack className="gap-1 flex-1 min-w-0">
                    <HStack align="start" className="gap-2">
                        <span className="text-muted-foreground text-xs shrink-0 mt-0.5">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="text-foreground font-medium break-words whitespace-normal flex-1 min-w-0">
                            <LocalizedText message={log.message} />
                        </span>
                    </HStack>

                    {log.details && (
                        <div className="text-muted-foreground text-xs whitespace-pre-wrap break-words">
                            <LocalizedText message={log.details} />
                        </div>
                    )}

                    {log.actions && log.actions.length > 0 && (
                        <HStack className="pt-1 gap-2 flex-wrap">
                            {log.actions.map((act: any, idx: number) => {
                                const onClick = async () => {
                                    const result = await act.onClick();
                                    if (result.status === Result.Status.Success) {
                                        removeLog(log.id);
                                    }
                                }

                                return (
                                    <Button key={idx} variant="outline" size="sm" onClick={onClick} className="h-6 text-xs px-2">
                                        <LocalizedText message={act.label} />
                                    </Button>
                                )
                            })}
                        </HStack>
                    )}
                </VStack>

                <Button
                    size={"icon-xs"}
                    variant={"ghost"}
                    onClick={() => removeLog(log.id)}
                    className="ml-auto"
                >
                    <X size={14} />
                </Button>
            </HStack>
        </VStack>
    );
}
