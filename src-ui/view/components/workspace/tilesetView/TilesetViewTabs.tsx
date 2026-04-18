import { X } from "lucide-react";
import { useMemo, useRef } from "react";

import { WorkspaceService } from "@/shared/services/workspaceService";
import { useHorizontalScroll } from "@/view/hooks/useHorizontalSCroll";
import { useTilesetSessionStore } from "@/view/stores/tilesetSessionStore";

import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";

export default function TilesetViewTabs() {
	const ref = useRef<HTMLDivElement>(null);

	useHorizontalScroll(ref);

	const { version, getTilesetDisplayData, getCurrentTilesetSessionId } = useTilesetSessionStore();

	const tilesetsDisplayData = useMemo(() => {
		return getTilesetDisplayData();
	}, [version, getTilesetDisplayData])

	const currentTilesetSessionId = useMemo(() => {
		return getCurrentTilesetSessionId();
	}, [version, getCurrentTilesetSessionId])

	return (
		<HStack className="w-full h-fit" justify="start" align="center">
			<div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar bg-surface-sunken w-full h-8">
				{tilesetsDisplayData.map((tilesetSession) => {
					const isCurrent = currentTilesetSessionId === tilesetSession.sessionId;
					const openTilesetSession = () => {
						if (isCurrent) return;
						WorkspaceService.openTilesetSession(tilesetSession.sessionId);
					};
					const closeTilesetSession = (e: any) => {
						e.stopPropagation();
						WorkspaceService.closeTilesetSession(tilesetSession.sessionId);
					};
					return (
						<Button key={tilesetSession.sessionId}
							variant={"empty"}
							onClick={openTilesetSession} size={"sm"}
							className={`pr-1 h-full border-none ${isCurrent ? "text-foreground bg-surface tab relative" : "text-muted-foreground hover:text-foreground bg-transparent"}`}>
							<style>{`.tab::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background-color: var(--foreground); }`}</style>
							{tilesetSession.name}
							<div className="hover:bg-surface-sunken p-1" onClick={closeTilesetSession}>
								<X />
							</div>
						</Button>
					);
				})}
			</div>
		</HStack>
	);
}
