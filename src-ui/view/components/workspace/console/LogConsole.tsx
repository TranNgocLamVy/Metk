import { HStack, VStack } from "../../custom/stack/Stack";
import { ScrollArea } from "../../shadcn/scroll-area";
import { useConsoleStore } from "@/view/stores/consoleStore";
import { Info, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "../../shadcn/button";
import { useTranslation } from "react-i18next";
import { Result } from "@/shared/types/result";

export default function Log() {
    const {t: translate} = useTranslation();
    const { logs } = useConsoleStore();

    return (
        <ScrollArea className="h-full w-full">
            <VStack className="w-full gap-0">
                {logs.map((log) => (
                    <VStack key={log.id} className="w-full p-2 text-sm hover:bg-foreground/5">
                        <HStack align="start" className="gap-2">
                            <div className="mt-0.5 shrink-0">
                                {log.level === "info" && <Info size={14} className="text-blue-500" />}
                                {log.level === "success" && <CheckCircle2 size={14} className="text-green-500" />}
                                {log.level === "warning" && <AlertTriangle size={14} className="text-yellow-500" />}
                            </div>
                            
                            <VStack className="gap-1 flex-1 min-w-0">
                                <HStack align="center" className="gap-2">
                                    <span className="text-muted-foreground text-xs shrink-0">
                                        [{new Date(log.timestamp).toLocaleTimeString()}]
                                    </span>
                                    <span className="text-foreground font-medium break-words">{translate(log.message)}</span>
                                    <Button size={"icon-xs"} variant={"ghost"} onClick={() => useConsoleStore.getState().removeLog(log.id)} className="ml-auto"><X/></Button>
                                </HStack>

                                {log.details && (
                                    <div className="text-muted-foreground text-xs whitespace-pre-wrap">
                                        {translate(log.details)}
                                    </div>
                                )}

                                {log.actions && log.actions.length > 0 && (
                                    <HStack className="pt-1 gap-2 flex-wrap">
                                        {log.actions.map((act, idx) => {
                                            const onClick = async () => {
                                                const result = await act.onClick();
                                                if (result.status === Result.Status.Success) useConsoleStore.getState().removeLog(log.id);
                                            }

                                            return (
                                                <Button key={idx} variant="outline" size="sm" onClick={onClick} className="h-6 text-xs px-2">
                                                    {translate(act.label)}
                                                </Button>
                                            )
                                        })}
                                    </HStack>
                                )}
                            </VStack>
                        </HStack>
                    </VStack>
                ))}
                {logs.length === 0 && (
                    <div className="w-full text-center p-4 text-muted-foreground text-sm">No logs to display.</div>
                )}
            </VStack>
        </ScrollArea>
    );
}