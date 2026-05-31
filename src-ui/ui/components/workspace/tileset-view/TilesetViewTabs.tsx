import { Ellipsis, Pen, Plus, Trash2, X } from "lucide-react";
import { useCallback, useRef } from "react";

import { WorkspaceService } from "@/shared/services/workspace.service";
import { useHorizontalScroll } from "@/ui/hooks/useHorizontalSCroll.hook";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";

import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { LocalizedText } from "../../custom/LocalizeText";
import { TilesetService } from "@/shared/services/tileset.service";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { DialogService } from "@/shared/services/dialog.service";

export default function TilesetViewTabs() {
	const ref = useRef<HTMLDivElement>(null);

	useHorizontalScroll(ref);

	const { activeSession, tilesetSessions } = useTilesetSessionStore();


	const onEditTileset = useCallback(() => {
		const tilesetSession = appKernel.editorFacade.getActiveTilesetSession();
		if (!tilesetSession) return;

		DialogService.openEditTilesetDialog(tilesetSession.tileset.id);
	}, []);

	const onDeleteTileset = useCallback(() => {
		const tilesetSession = appKernel.editorFacade.getActiveTilesetSession();
		if (!tilesetSession) return;
		const selectedTilesetId = tilesetSession.tileset.id;
		TilesetService.deleteTileset(selectedTilesetId);
	}, [])

	return (
		<HStack className="w-full h-fit" justify="start" align="center">
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant={"ghost"} size={"icon"} asChild className="p-1.5">
						<Ellipsis />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="bottom">
					<DropdownMenuItem onClick={TilesetService.createTileset}>
						<Plus />
						<LocalizedText message="workspace.tilesetSelector.dropdown.new" />
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onEditTileset} disabled={!activeSession?.id}>
						<Pen />
						<LocalizedText message="workspace.tilesetSelector.dropdown.edit" />
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onDeleteTileset} disabled={!activeSession?.id}>
						<Trash2 className="text-destructive" />
						<LocalizedText message="workspace.tilesetSelector.dropdown.delete" />
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar bg-surface-sunken w-full h-8">
				{tilesetSessions.map((tilesetSession) => {
					const isCurrent = activeSession?.id === tilesetSession.sessionId;
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
