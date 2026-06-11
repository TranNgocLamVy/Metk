import { Result } from "@/shared/types/result";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { ScrollArea } from "@/ui/components/shadcn/scroll-area";
import { useConsoleStore } from "@/ui/stores/console.store";
import { X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ErrorConsole() {
    const { errors } = useConsoleStore();
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [errors.length]);

    return (
        <ScrollArea className="h-full w-full">
            <VStack className="w-full gap-0">
                {errors.map((error) => (
                    <ErrorItem key={error.uiId} error={error} />
                ))}
                {errors.length === 0 && (
                    <div className="w-full text-center p-4 text-muted-foreground text-sm">
                        <LocalizedText message="console.empty.errors" />
                    </div>
                )}
                <div ref={bottomRef} className="h-1" />
            </VStack>
        </ScrollArea>
    );
}

function ErrorItem({ error }: { error: any }) {
    const [flashState, setFlashState] = useState<"bright" | "normal">("bright");
    const [isSettled, setIsSettled] = useState(false);

    useEffect(() => {
        let toggleCount = 0;
        const maxToggleTime = 4;
        const interval = setInterval(() => {
            setFlashState((prev) => (prev === "bright" ? "normal" : "bright"));
            toggleCount++;
            if (toggleCount >= maxToggleTime) {
                clearInterval(interval);
                setIsSettled(true);
            }
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const bgClass = isSettled
        ? "bg-destructive/5 hover:bg-destructive/10"
        : flashState === "bright"
            ? "bg-destructive/30"
            : "bg-destructive/5";

    return (
        <VStack
            className={`w-full border-b border-destructive/20 p-2 text-sm transition-colors duration-300 animate-in ${bgClass}`}
        >
            <HStack align="start" className="gap-2">
                <XCircle size={14} className="text-destructive mt-0.5 shrink-0" />

                <VStack className="gap-1 flex-1 min-w-0">
                    <HStack align="center" className="gap-2">
                        <span className="text-muted-foreground text-xs shrink-0 mt-0.5">
                            [{new Date(error.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="text-destructive font-medium break-words whitespace-normal flex-1 min-w-0">
                            {error.message && <LocalizedText message={error.message} />}
                        </span>
                    </HStack>

                    {error.stacks && (
                        <div className="text-muted-foreground text-xs font-mono bg-background/50 p-2 rounded-md mt-1 border border-border/50 flex flex-col gap-1">
                            {error.stacks.map((stack: any, index: number) => (
                                <div key={index} className="break-all whitespace-pre-wrap w-full">
                                    <LocalizedText message={stack} />
                                </div>
                            ))}
                        </div>
                    )}

                    {error.actions && error.actions.length > 0 && (
                        <HStack className="pt-2 gap-2 flex-wrap">
                            {error.actions.map((act: any, idx: number) => {
                                const onClick = async () => {
                                    const result = await act.onClick();
                                    if (result.status === Result.Status.Success) {
                                        useConsoleStore.getState().removeError(error.id);
                                    }
                                }
                                return (
                                    <Button key={idx} variant={act.variant ?? "default"} size="sm" onClick={onClick} className="h-6 text-xs px-2">
                                        <LocalizedText message={act.label ?? ""} />
                                    </Button>
                                )
                            })}
                        </HStack>
                    )}
                </VStack>

                <Button
                    size={"icon-xs"}
                    variant={"ghost"}
                    onClick={() => useConsoleStore.getState().removeError(error.id)}
                    className="ml-auto"
                >
                    <X size={14} />
                </Button>
            </HStack>
        </VStack>
    );
}