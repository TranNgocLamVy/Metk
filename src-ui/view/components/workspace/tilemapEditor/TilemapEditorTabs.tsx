import { X } from "lucide-react";
import { Fragment, useMemo, useRef } from "react";

import { AppCore } from "@/core/appcore";
import { DialogService } from "@/shared/services/dialogService";
import { ToastService } from "@/shared/services/toastService";
import { WorkspaceService } from "@/shared/services/workspaceService";
import { useHorizontalScroll } from "@/view/hooks/useHorizontalSCroll";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";

import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/tooltip";

export default function TilemapEditorTabs() {
	const ref = useRef<HTMLDivElement>(null);

	useHorizontalScroll(ref);

	const { version, getTileamapDisplayData, getCurrentTilemapSessionId } = useTilemapSessionStore();

	const tilemapSession = useMemo(() => {
		return getTileamapDisplayData();
	}, [version, getTileamapDisplayData]);

	const currentSessionId = useMemo(() => {
		return getCurrentTilemapSessionId();
	}, [version, getCurrentTilemapSessionId]);

	return (
		<HStack className="w-full h-fit bg-surface pr-1" justify="start" align="center">
			<div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar w-full h-8 bg-surface-base">
				{tilemapSession.map((session) => {
					const isCurrent = currentSessionId === session.sessionId;
					const isDirty = session.isDirty;
					const openTilemapSession = () => {
						if (isCurrent) return;
						WorkspaceService.openTilemapSession(session.sessionId);
					};
					const closeTilemapSession = async (e: any) => {
						e.stopPropagation();
						if (isDirty) {
							const saveResult = await DialogService.openSaveDialog({
								title: "Do you want to save changes to the tilemap before closing it?",
								description: "If you don't save, your changes will be lost.",
							})
							if (saveResult === "save") {
								const commandManager = AppCore.getIns().systemCommandManager
								await commandManager.execute("project.save");
								WorkspaceService.closeTilemapSession(session.sessionId);
							} else if (saveResult === "not save") {
								WorkspaceService.closeTilemapSession(session.sessionId);
							}
						} else {
							WorkspaceService.closeTilemapSession(session.sessionId);
						}
					};
					return (
						<Button variant={"empty"} key={session.sessionId} onClick={openTilemapSession} size={"sm"} className={`group h-full pr-1 rounded-none cursor-pointer border-none ${isCurrent ? "text-foreground bg-surface tm_tab relative" : "text-muted-foreground hover:text-foreground bg-transparent"}`}>
							<style>{`.tm_tab::after { content: ""; position: absolute; bottom: 0; left: 4px; width: calc(100% - 4px); height: 2px; background-color: var(--foreground); }`}</style>
							{session.name}
							<div className="group/icon ml-1 flex w-6 h-6 items-center justify-center rounded-md hover:bg-surface-sunken" onClick={closeTilemapSession}>
								{isDirty ? (
									<Fragment>
										<div className="h-2 w-2 rounded-full bg-foreground group-hover/icon:hidden" />
										<X className="hidden h-4 w-4 group-hover/icon:block" />
									</Fragment>
								) : (
									<X className={`h-4 w-4 transition-opacity ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
								)}
							</div>
						</Button>
					);
				})}
			</div>
		</HStack>
	);
}
