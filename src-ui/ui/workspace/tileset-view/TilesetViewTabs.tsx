import { Ellipsis, Pen, Plus, Trash2, X } from "lucide-react";
import { useCallback, useRef } from "react";

import * as WorkspaceActions from "@/application/actions/workspace.actions";
import { useHorizontalScroll } from "@/ui/hooks/useHorizontalSCroll.hook";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";

import * as TilesetActions from "@/application/actions/tileset.actions";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";
import { DialogService } from "@/ui/dialogs/dialog-gateway";

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
		TilesetActions.deleteTilesetFile(selectedTilesetId);
	}, [])

	return (
		<HStack className="w-full h-fit pb-frame-half px-frame-quarter" justify="start" align="center">
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Button variant={"ghost"} size={"icon"} asChild className={`p-1.5 border-(length:--panel-border-width) border-frame border-x-0`}>
						<Ellipsis />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="top">
					<DropdownMenuItem onClick={TilesetActions.createTileset}>
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
				<div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none border-t-(length:--panel-border-width) border-frame" />
				{tilesetSessions.map((tilesetSession, index) => {
					const isCurrent = activeSession?.id === tilesetSession.sessionId;
					const openTilesetSession = () => {
						if (isCurrent) return;
						WorkspaceActions.openTilesetSession(tilesetSession.sessionId);
					};
					const closeTilesetSession = (e: any) => {
						e.stopPropagation();
						WorkspaceActions.closeTilesetSession(tilesetSession.sessionId);
					};
					return (
						<Button key={tilesetSession.sessionId}
							variant={"empty"}
							onClick={openTilesetSession} size={"sm"}
							className={`pr-1 h-full border-none text-foreground relative cursor-pointer ${isCurrent ? "bg-surface" : "bg-transparent"}`}>
							{index == 0 && <div className="absolute bottom-0 top-0 left-0 right-0 border-l-(length:--panel-border-width) pointer-events-none border-frame" />}
							{isCurrent && <div className="absolute bottom-0 top-0 left-0 right-0 border-(length:--panel-border-width) border-b-0 pointer-events-none border-frame" />}
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
