import { X } from "lucide-react";
import { useRef } from "react";

import { WorkspaceService } from "@/shared/services/workspaceService";
import { useHorizontalScroll } from "@/view/hooks/useHorizontalSCroll";
import { useTilesetSessionStore } from "@/view/stores/application/tilesetSessionStore";
import { TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip";

import TilesetViewDropDownMenu from "../../contextMenu/tilesetViewContextMenu";
import { HStack } from "../../custom/stack/stack";
import { Button } from "../../shadcn/button";
import { Tooltip } from "../../shadcn/tooltip";

export default function TilesetViewTabs() {
	const ref = useRef<HTMLDivElement>(null);

	useHorizontalScroll(ref);

	const { tilesetsSession, currentSession } = useTilesetSessionStore();

	return (
		<HStack className="w-full h-fit bg-background" justify="start" align="center">
			<TilesetViewDropDownMenu />
			<div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar gap-0">
				{tilesetsSession.map((tilesetSession) => {
					const isCurrent = currentSession?.session.id === tilesetSession.sessionId;
					const openTilesetSession = () => {
						if (isCurrent) return;
						WorkspaceService.openTilesetViewSesion(tilesetSession.sessionId);
					};
                    const closeTilesetSession = (e: any) => {
                        e.stopPropagation();
                        WorkspaceService.closeTilesetSession(tilesetSession.sessionId);
                    };
					return (
						<Button key={tilesetSession.sessionId} onClick={openTilesetSession} size={"sm"} className={`pr-1 rounded-none text-foreground hover:bg-secondary-background cursor-pointer ${isCurrent ? "border-b-2 border-b-foreground bg-secondary-background" : "bg-background"}`}>
							{tilesetSession.name}
							<Tooltip delayDuration={500}>
								<TooltipTrigger asChild>
									<div className="rounded-2xl hover:bg-background p-1" onClick={closeTilesetSession}>
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
