import { HStack, VStack } from "../../custom/stack/Stack";
import { ScrollArea } from "../../shadcn/scroll-area";
import { useConsoleStore } from "@/view/stores/consoleStore";
import { X, XCircle } from "lucide-react";
import { Button } from "../../shadcn/button";
import { useTranslation } from "react-i18next";
import { Result } from "@/shared/types/result";

export default function Error() {
    const { t: translate } = useTranslation();

    const { errors } = useConsoleStore();

    return (
        <ScrollArea className="h-full w-full">
            <VStack className="w-full gap-0">
                {errors.map((error) => {
                    return (
                        <VStack key={error.id} className="w-full border-b border-destructive/20 bg-destructive/5 p-2 text-sm hover:bg-destructive/10 transition-colors">
                            <HStack align="start" className="gap-2">
                                <XCircle size={14} className="text-destructive mt-0.5 shrink-0" />

                                <VStack className="gap-1 flex-1 min-w-0">
                                    <HStack align="center" className="gap-2">
                                        <span className="text-muted-foreground text-xs shrink-0">
                                            [{new Date(error.timestamp).toLocaleTimeString()}]
                                        </span>
                                        <span className="text-destructive font-medium break-words">{translate(error.message)}</span>
                                        <Button size={"icon-xs"} variant={"ghost"} onClick={() => useConsoleStore.getState().removeError(error.id)} className="ml-auto"><X/></Button>
                                    </HStack>

                                    {error.stacks && (
                                        <div className="text-muted-foreground text-xs font-mono bg-background/50 p-2 rounded-md whitespace-pre-wrap overflow-x-auto mt-1 border border-border/50">
                                            {error.stacks.map(stack => translate(stack)).join("\n")}
                                        </div>
                                    )}

                                    {error.actions && error.actions.length > 0 && (
                                        <HStack className="pt-2 gap-2 flex-wrap">
                                            {error.actions.map((act, idx) => {
                                                const onClick = async () => {
                                                    const result = await act.onClick();
                                                    if (result.status === Result.Status.Success) useConsoleStore.getState().removeError(error.id);
                                                }

                                                return (
                                                    <Button key={idx} variant={act.variant ?? "default"} size="sm" onClick={onClick} className="h-6 text-xs px-2">
                                                        {translate(act.label)}
                                                    </Button>
                                                )
                                            })}
                                        </HStack>
                                    )}
                                </VStack>
                            </HStack>
                        </VStack>
                    )
                })}
                {errors.length === 0 && (
                    <div className="w-full text-center p-4 text-muted-foreground text-sm">No errors.</div>
                )}
            </VStack>
        </ScrollArea>
    );
}