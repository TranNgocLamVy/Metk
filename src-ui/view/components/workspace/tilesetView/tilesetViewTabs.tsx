import { useRef } from "react";

import { WorkspaceService } from "@/shared/services/workspaceService";
import { useHorizontalScroll } from "@/view/hooks/useHorizontalSCroll";
import { useTilesetViewStore } from "@/view/stores/application/tilesetViewStore";

import TilesetViewDropDownMenu from "../../contextMenu/tilesetViewContextMenu";
import { HStack } from "../../custom/stack/stack";
import { Button } from "../../shadcn/button";

export default function TilesetViewTabs() {
	const ref = useRef<HTMLDivElement>(null);

	useHorizontalScroll(ref);

	const { tilesetsViewSession, currentTilesetViewSession } = useTilesetViewStore();

	return (
		<HStack className="w-full h-fit bg-background" justify="start" align="center">
			<TilesetViewDropDownMenu />
			<div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar gap-0">
				{tilesetsViewSession.map((tilesetSession) => {
					const isCurrent = currentTilesetViewSession?.id === tilesetSession.sessionId;
					const onClick = () => {
						if (isCurrent) return;
						WorkspaceService.openTilesetViewSesion(tilesetSession.sessionId);
					};
					return (
						<Button key={tilesetSession.sessionId} onClick={onClick} size={"sm"} className={`rounded-none text-foreground hover:bg-secondary-background cursor-pointer ${isCurrent ? "border-b-2 border-b-foreground bg-secondary-background" : "bg-background"}`}>
							{tilesetSession.name}
						</Button>
					);
				})}
			</div>
		</HStack>
	);
}