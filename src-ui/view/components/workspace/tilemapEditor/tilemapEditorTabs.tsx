import { X } from "lucide-react";
import { useRef } from "react";

import { WorkspaceService } from "@/shared/services/workspaceService";
import { useHorizontalScroll } from "@/view/hooks/useHorizontalSCroll";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";
import { TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";

import { HStack } from "../../custom/stack/stack";
import { Button } from "../../shadcn/button";
import { Tooltip } from "../../shadcn/tooltip";

export default function TilemapEditorTabs() {
    const ref = useRef<HTMLDivElement>(null);

    useHorizontalScroll(ref);

    const { tilemapsSession, currentSession } = useTilemapSessionStore();

    return (
        <HStack className="w-full h-fit bg-secondary-background px-1" justify="start" align="center">
            <div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar">
                {tilemapsSession.map((tilemapSession) => {
                    const isCurrent = currentSession?.session.id === tilemapSession.sessionId;
                    const openTilemapSession = () => {
                        if (isCurrent) return;
                        WorkspaceService.openTilemapSession(tilemapSession.sessionId);
                    };
                    const closeTilemapSession = (e: any) => {
                        e.stopPropagation();
                        WorkspaceService.closeTilemapSession(tilemapSession.sessionId);
                    };
                    return (
                        <Button key={tilemapSession.sessionId} onClick={openTilemapSession} size={"sm"} className={`pr-1 rounded-none text-foreground hover:bg-background cursor-pointer ${isCurrent ? "border-b-2 border-b-foreground bg-background shadow-sm" : "bg-secondary-background"}`}>
                            {tilemapSession.name}
                            <Tooltip delayDuration={500}>
                                <TooltipTrigger asChild>
                                    <div className="rounded-2xl hover:bg-background p-1" onClick={closeTilemapSession}>
                                        <X />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-background p-1 rounded-lg">
                                    <p>Close</p>
                                </TooltipContent>
                            </Tooltip>
                        </Button>
                    );
                })}
            </div>
        </HStack>
    );
}
