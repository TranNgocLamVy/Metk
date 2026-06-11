import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import QuickToolTip from "@/ui/components/custom/QuickToolTip";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { useConsoleStore } from "@/ui/stores/console.store";
import { Ban, ChevronsDown, Info, TriangleAlert } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import ErrorConsole from "./ErrorConsole";
import LogConsole from "./LogConsole";


export default function WorkspaceConsole() {
    const { isConsoleOpen, consoleType, closeConsole, setConsoleType, clearErrors, clearLogs } = useConsoleStore();

    const [height, setHeight] = useState<number>(200);

    const consoleRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!consoleRef.current || !consoleRef.current.parentElement) return;

            const parentElement = consoleRef.current.parentElement;
            const parentRect = parentElement.getBoundingClientRect();
            const parentHeight = parentRect.height;

            const newHeight = parentRect.bottom - moveEvent.clientY;

            const maxHeight = parentHeight * 0.8;
            const constrainedHeight = Math.max(150, Math.min(newHeight, maxHeight));

            setHeight(constrainedHeight);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    const clearCurrentConsole = useCallback(() => {
        if (consoleType === "log") clearLogs();
        else clearErrors();
    }, [consoleType]);

    if (!isConsoleOpen) return null;
    return (
        <div ref={consoleRef} className="w-full bg-transparent absolute bottom-0 pb-11 pointer-events-none px-3 z-10" style={{ height: `${height}px` }} >
            <div className="bg-surface flex flex-col w-full h-full shadow-md pointer-events-auto">
                <div className="draggable-resize w-full h-2 cursor-row-resize z-10 bg-surface-sunken transition-colors shrink-0 flex justify-center items-center gap-0.5" onMouseDown={handleMouseDown}>
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                </div>
                <VStack className="w-full h-full p-2 gap-1 overflow-auto">
                    <HStack align="center" className="w-full gap-2">
                        <HStack align="center" className={`text-xs px-4 h-6 w-fit border-b-2 gap-1 ${consoleType === "log" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`} onClick={() => setConsoleType("log")}>
                            <Info size={12} />
                            <LocalizedText message="console.tabs.log" />
                        </HStack>
                        <HStack align="center" className={`text-xs px-4 h-6 w-fit border-b-2 gap-1 ${consoleType === "error" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`} onClick={() => setConsoleType("error")}>
                            <TriangleAlert size={12} />
                            <LocalizedText message="console.tabs.error" />
                        </HStack>


                        <QuickToolTip toolTip="console.actions.clear">
                            <Button variant={"ghost"} size={"icon-xs"} className="ml-auto" onClick={clearCurrentConsole}>
                                <Ban />
                            </Button>
                        </QuickToolTip>
                        <QuickToolTip toolTip="console.actions.close">
                            <Button variant={"ghost"} size={"icon-sm"} onClick={closeConsole}>
                                <ChevronsDown />
                            </Button>
                        </QuickToolTip>
                    </HStack>
                    <VStack className="relative flex-1 p-2 min-h-0 overflow-hidden bg-surface-base">
                        {consoleType === "log" && <LogConsole />}
                        {consoleType === "error" && <ErrorConsole />}
                    </VStack>
                </VStack>
            </div>
        </div>
    );
}