import { Ellipsis, Pen, Plus, Trash2, X } from "lucide-react";
import { useCallback, useRef } from "react";

import { WorkspaceService } from "@/shared/services/workspace.service";
import { useHorizontalScroll } from "@/ui/hooks/useHorizontalSCroll.hook";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { DialogService } from "@/shared/services/dialog.service";
import { TilesetService } from "@/shared/services/tileset.service";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";

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
		<HStack className="w-full h-fit pb-frame-half px-frame-quarter" justify="start" align="center">
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant={"ghost"} size={"icon"} asChild className={`p-1.5 border border-foreground/30 border-x-0`}>
						<Ellipsis />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="top">
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
			<div ref={ref} className="flex flex-row relative items-center overflow-y-scroll scroll-smooth no-scrollbar bg-surface-sunken w-full h-8">
				<div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none border-t border-foreground/30" />
				{tilesetSessions.map((tilesetSession, index) => {
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
							className={`pr-1 h-full border-none text-foreground relative cursor-pointer ${isCurrent ? "bg-surface" : "bg-transparent"}`}>
							{index == 0 && <div className="absolute bottom-0 top-0 left-0 right-0 border-l pointer-events-none border-foreground/30" />}
							{isCurrent && <div className="absolute bottom-0 top-0 left-0 right-0 border border-b-0 pointer-events-none border-foreground/30" />}
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
