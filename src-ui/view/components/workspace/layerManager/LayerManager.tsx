import { DragEvent, Fragment, useEffect, useMemo, useState } from "react";

import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { useLayerManagerStore } from "@/view/stores/layerManagerStore";

import { VStack } from "../../custom/stack/Stack";
import ContextMenuItemGroup from "../../contextMenu/ContextMenuItemGroup";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../shadcn/context-menu";
import { ScrollArea } from "../../shadcn/scroll-area";
import { LayerManagerContextMenu } from "./ContextMenu";
import LayerNodeRow from "./LayerNodeRow";
import LayerMenuBar from "./LayerMenuBar";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";
import { appCore } from "@/core/appcore";
import { LocalizedText } from "../../custom/LocalizeText";
import { Button } from "../../shadcn/button";
import { useDialogStore } from "@/view/stores/dialogStore";
import { DialogZLevel } from "@/shared/types/dialog";

export default function LayerManager() {
	const { version, getFlatView, getSelectedLayers, setTargetLayer, refresh } = useLayerManagerStore();
	useLayerManagerStore((s) => s.version);

	const { version: tilemapVersion } = useTilemapSessionStore();
	
	const currentTilemapSession = useMemo(() => {
		const tilemapSessionManager = appCore.workspaceManager.currentWorkspace?.tilemapSessionManager;
		if (!tilemapSessionManager) return null;
		return tilemapSessionManager.currentTilemapSession;
	}, [tilemapVersion, version]);

	const selectedIds = useMemo(() => {
		return getSelectedLayers();
	}, [version, tilemapVersion]);

	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
		refresh();
	}, []);

	const flatView = useMemo(() => {
		return getFlatView();
	}, [version, tilemapVersion]);

	const handleContainerDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!currentTilemapSession) return;
		const root = currentTilemapSession.tilemap.rootLayer;

		const data = e.dataTransfer.getData("application/json");
		if (!data) return;

		try {
			const { ids } = JSON.parse(data);
			if (Array.isArray(ids) && ids.length > 0) {
				TilemapLayerService.moveLayers(ids, root.id, "inside");
			}
		} catch (err) {
			console.error("Container drop error:", err);
		}
	};

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const onOpenChange = (open: boolean) => {
		if (!open) setTargetLayer(null);
	};

	if (!isMounted || !currentTilemapSession) {
		return (
			<VStack className="w-full h-full px-1 py-2 bg-surface" justify="center" align="center">
				<VStack className="w-full h-full bg-surface-base shadow-sm" justify="center" align="center">
					<span className="text-sm">
						<LocalizedText message="workspace.tilemapEditor.empty" />
					</span>
					<Button variant={"link"} onClick={() => useDialogStore.getState().openDialog("OPEN_FILE_DIALOG", { zLevel: DialogZLevel.Modal }, { panel: "tilemap" })}>
						<LocalizedText message="workspace.tilemapEditor.open" />
					</Button>
				</VStack>
			</VStack>
		);
	}

	return (
		<VStack className="w-full h-full relative overflow-hidden bg-surface">
			<VStack onDrop={handleContainerDrop} onDragOver={handleDragOver} className="absolute inset w-full h-full px-1 py-2 bg-surface">
				<ContextMenu onOpenChange={onOpenChange}>
					<ContextMenuTrigger asChild>
						<ScrollArea className="w-full h-full shadow-sm bg-surface-base">
							<div className="flex flex-col w-full min-h-full pb-10">
								{flatView.map((view) => (
									<LayerNodeRow key={view.id} view={view} isSelected={selectedIds.includes(view.id)} />
								))}
							</div>
							<div className="flex-1 min-h-[10px] h-full transition-colors" />
						</ScrollArea>
					</ContextMenuTrigger>
					<ContextMenuContent className={LayerManagerContextMenu.className}>
						<ContextMenuItemGroup groups={LayerManagerContextMenu.groups} />
					</ContextMenuContent>
				</ContextMenu>
			</VStack>
			<LayerMenuBar />
		</VStack>
	);
}
