import { X } from "lucide-react";
import { Fragment, useRef } from "react";

import { WorkspaceService } from "@/shared/services/workspace.service";
import { useHorizontalScroll } from "@/ui/hooks/useHorizontalSCroll.hook";
import { useTilemapSessionStore } from "@/ui/stores/tilemap-session.store";

import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";

export default function TilemapEditorTabs() {
	const ref = useRef<HTMLDivElement>(null);

	useHorizontalScroll(ref);

	const { tilemapSessions, activeSession } = useTilemapSessionStore();

	return (
		<HStack className="w-full h-fit bg-surface pr-1 relative z-10" justify="start" align="center">
            <style>{`.tm_tab::after { content: ""; position: absolute; bottom: 0; left: 4px; width: calc(100% - 4px); height: 2px; background-color: var(--foreground); }`}</style>
			<div ref={ref} className="flex flex-row items-center overflow-x-auto scroll-smooth no-scrollbar w-full h-8 bg-surface-sunken">
				{tilemapSessions.map((session) => {
					const isCurrent = activeSession?.id === session.sessionId;
					const isDirty = session.isDirty;
                    
					const openTilemapSession = () => {
						if (isCurrent) return;
						WorkspaceService.openTilemapSession(session.sessionId);
					};
                    
					const closeTilemapSession = async (e: any) => {
						e.stopPropagation();
						WorkspaceService.closeTilemapSession(session.sessionId);
					};
                    
					return (
						<Button 
                            variant={"empty"} 
                            key={session.sessionId} 
                            onClick={openTilemapSession} 
                            size={"sm"} 
                            className={`group relative h-full pr-1 rounded-none cursor-pointer border-none ${isCurrent ? "text-foreground bg-surface tm_tab" : "text-muted-foreground hover:text-foreground bg-transparent"}`}
                        >
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