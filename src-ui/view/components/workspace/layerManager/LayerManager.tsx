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

export default function LayerManager() {
	const { currentSession, version, getFlatView, setTargetLayer } = useLayerManagerStore();
	useLayerManagerStore((s) => s.version);
	
	const selectedIds = useLayerManagerStore((s) => s.selectedIds);

	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const flatView = useMemo(() => {
		return getFlatView();
	}, [currentSession, version]);

	const handleContainerDrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!currentSession) return;
		const root = currentSession.tilemap.rootLayer;

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

	if (!isMounted || !currentSession) {
		return (
			<VStack className="w-full h-full" justify="center" align="center">
				Select a tilemap
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
