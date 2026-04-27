import { DragEvent, useCallback, useEffect } from "react";

import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { LayerView, useLayerManagerStore } from "@/view/stores/layerManagerStore";

import { VStack } from "../../custom/stack/Stack";
import ContextMenuItemGroup from "../../contextMenu/ContextMenuItemGroup";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../shadcn/context-menu";
import { ScrollArea } from "../../shadcn/scroll-area";
import { LayerManagerContextMenu } from "./ContextMenu";
import LayerNodeRow from "./LayerNodeRow";
import LayerMenuBar from "./LayerMenuBar";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";
import { LocalizedText } from "../../custom/LocalizeText";
import { Button } from "../../shadcn/button";
import { useDialogStore } from "@/view/stores/dialogStore";
import { DialogZLevel } from "@/shared/types/dialog";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";

export default function LayerManager() {
	const { layerViews, selectedLayers, setLayerViews, setSelectedLayer } = useLayerManagerStore();

	const { activeSession } = useTilemapSessionStore();

	const updateLayerView = useCallback(() => {
		if (!activeSession) {
			setLayerViews([]);
			setSelectedLayer([]);
			return;
		}
		const root = activeSession.tilemap.rootLayer;
		const result: LayerView[] = [];
        const processLayer = (layer: BaseLayer, depth: number) => {
			result.push({ id: layer.id, layer, depth });
            if (layer instanceof GroupLayer && layer.isOpen) {
                layer.layers.forEach(c => processLayer(c, depth + 1));
            }
        };
        root.layers.forEach(c => processLayer(c, 0));
		setLayerViews(result);
	}, [activeSession, setLayerViews])

	useEffect(() => {
		if (!activeSession) return;
	
		updateLayerView();
		setSelectedLayer(activeSession.layerState.selectedLayers);
		activeSession.on("onSelectedLayersChanged", setSelectedLayer);
		activeSession.on("onLayerChange", updateLayerView);

		return () => {
			activeSession.off("onSelectedLayersChanged", setSelectedLayer);
			activeSession.off("onLayerChange", updateLayerView)
			setLayerViews([]);
			setSelectedLayer([]);
		}
	}, [activeSession])

	const handleContainerDrop = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!activeSession) return;
		const root = activeSession.tilemap.rootLayer;

		const data = e.dataTransfer.getData("application/json");
		if (!data) return;

		const { ids } = JSON.parse(data);
		if (Array.isArray(ids) && ids.length > 0) {
			TilemapLayerService.moveLayers(ids, root.id, "inside");
		}
	}, [activeSession])

	const handleDragOver = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	}, [])

	const onOpenChange = useCallback((open: boolean) => {
		if (activeSession) activeSession.targetLayer = null;
	}, [activeSession]);

	if (!activeSession) {
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
								{layerViews.map((view) => (
									<LayerNodeRow key={view.id} view={view} isSelected={selectedLayers.includes(view.id)} />
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
