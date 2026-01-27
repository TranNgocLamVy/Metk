import { X } from "lucide-react";
import { Fragment, useMemo, useRef } from "react";

import { AppCore } from "@/core/appcore";
import { DialogService } from "@/shared/services/dialogService";
import { ToastService } from "@/shared/services/toastService";
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

	const { version, getTileamapDisplayData, getCurrentTilemapSessionId } = useTilemapSessionStore();

	const tilemapSession = useMemo(() => {
		return getTileamapDisplayData();
	}, [version, getTileamapDisplayData]);

	const currentSessionId = useMemo(() => {
		return getCurrentTilemapSessionId();
	}, [version, getCurrentTilemapSessionId]);

	return (
		<HStack className="w-full h-fit bg-secondary-background px-1" justify="start" align="center">
			<div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar">
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
                                const commandManager = AppCore.getIns().commandManager
                                await commandManager.execute("project.save");
                                WorkspaceService.closeTilemapSession(session.sessionId);
                                ToastService.success({ message: "Tilemap saved successfully" });
                            } else if (saveResult === "not save") {
                                WorkspaceService.closeTilemapSession(session.sessionId);
                            }
                        } else {
                            WorkspaceService.closeTilemapSession(session.sessionId);
                        }
					};
					return (
						<Button key={session.sessionId} onClick={openTilemapSession} size={"sm"} className={`group pr-1 rounded-none text-foreground hover:bg-background cursor-pointer ${isCurrent ? "border-b-2 border-b-foreground bg-background shadow-sm" : "bg-secondary-background"}`}>
							{session.name}
							<Tooltip delayDuration={500}>
								<TooltipTrigger asChild>
									<div className="group/icon ml-1 flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted-foreground/20" onClick={closeTilemapSession}>
										{isDirty ? (
											<Fragment>
												<div className="h-2 w-2 rounded-full bg-foreground group-hover/icon:hidden" />
												<X className="hidden h-4 w-4 group-hover/icon:block" />
											</Fragment>
										) : (
											<X className={`h-4 w-4 transition-opacity ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
										)}
									</div>
								</TooltipTrigger>
								<TooltipContent side="top" className="bg-background p-2 rounded-lg shadow-md">
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
