import { useCallback, useRef, useState } from "react";
import { HStack, VStack } from "../../custom/stack/Stack";
import { useTerminalStore } from "@/view/stores/terminalStore";
import { Button } from "../../shadcn/button";
import { Ban, ChevronsDown, Info, TriangleAlert } from "lucide-react";
import QuickToolTip from "../../custom/QuickToolTip";
import Error from "./Error";
import Log from "./Log";


export default function Terminal() {
    const { isTerminalOpen, terminalType, closeTerminal, setTerminalType } = useTerminalStore();

    const [height, setHeight] = useState<number>(150);

    const terminalRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!terminalRef.current || !terminalRef.current.parentElement) return;

            const parentElement = terminalRef.current.parentElement;
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

    if (!isTerminalOpen) return null;
    return (
        <div ref={terminalRef} className="w-full bg-transparent absolute bottom-0 pb-5 px-4" style={{ height: `${height}px` }} >
            <div className="bg-surface-overlay-sunken flex flex-col w-full h-full shadow-md">
                <div className="draggable-resize w-full h-2 cursor-row-resize z-10 bg-surface transition-colors shrink-0 flex justify-center items-center gap-0.5" onMouseDown={handleMouseDown}>
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                    <div className="size-[4px] bg-foreground/20 rounded-full" />
                </div>
                <VStack className="w-full h-full p-2 gap-1 overflow-auto">
                    <HStack align="center" className="w-full gap-2">
                        <HStack align="center" className={`text-xs px-4 h-6 w-fit border-b-2 gap-1 ${terminalType === "log" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`} onClick={() => setTerminalType("log")}>
                            <Info size={12} />
                            Log
                        </HStack>
                        <HStack align="center" className={`text-xs px-4 h-6 w-fit border-b-2 gap-1 ${terminalType === "error" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`} onClick={() => setTerminalType("error")}>
                            <TriangleAlert size={12} />
                            Error
                        </HStack>


                        <QuickToolTip toolTip="Clear Terminal">
                            <Button variant={"ghost"} size={"icon-xs"} className="ml-auto">
                                <Ban />
                            </Button>
                        </QuickToolTip>
                        <QuickToolTip toolTip="Close Terminal">
                            <Button variant={"ghost"} size={"icon-sm"} onClick={closeTerminal}>
                                <ChevronsDown />
                            </Button>
                        </QuickToolTip>
                    </HStack>
                    <VStack className="relative flex-1 p-2 min-h-0 overflow-hidden bg-surface-base">
                        {terminalType === "log" && <Log />}
                        {terminalType === "error" && <Error />}
                    </VStack>
                </VStack>
            </div>
        </div>
    );
}