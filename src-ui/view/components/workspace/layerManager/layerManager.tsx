import { DragEvent, useEffect, useMemo, useState } from "react";

import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { VStack } from "../../custom/stack/stack";
import ContextMenuItemGroup from "../../layout/contextMenuWrapper/contextMenu/contextMenuItemGroup";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../shadcn/context-menu";
import { ScrollArea, ScrollBar } from "../../shadcn/scroll-area";
import { LayerManagerContextMenu } from "./layerContextMenuItem";
import LayerNodeRow from "./layerNodeRow";

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


    if (!isMounted || !currentSession) {
		return (
			<VStack className="w-full h-full" justify="center" align="center">
				Select a tilemap
			</VStack>
		);
	}

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

	return (
		<VStack className="w-full h-full rounded-md no-scrollbar" onDrop={handleContainerDrop} onDragOver={handleDragOver}>
			<ContextMenu onOpenChange={onOpenChange}>
				<ContextMenuTrigger className="w-full h-full no-scrollbar pt-1 bg-secondary-background">
					<ScrollArea className="w-full h-full no-scrollbar bg-background rounded-lg border-2 shadow-sm">
						<div className="flex-1 h-2 transition-colors" />
						<div className="flex flex-col w-full min-h-full pb-10">
							{flatView.map((view) => (
								<LayerNodeRow key={view.id} view={view} isSelected={selectedIds.includes(view.id)} />
							))}
						</div>
						<div className="flex-1 min-h-[10px] h-full transition-colors" />
						<ScrollBar className="w-2" />
					</ScrollArea>
				</ContextMenuTrigger>
				<ContextMenuContent className={LayerManagerContextMenu.className}>
					<ContextMenuItemGroup groups={LayerManagerContextMenu.groups} />
				</ContextMenuContent>
			</ContextMenu>
		</VStack>
	);
}
