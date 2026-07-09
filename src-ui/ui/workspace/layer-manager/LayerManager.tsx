import { DragEvent, FocusEvent, useCallback, useEffect, useRef } from "react";

import * as TilemapLayerActions from "@/application/actions/tilemap-layer.actions";
import { LayerView, useLayerManagerActions, useLayerViews, useSelectedLayers } from "@/ui/stores/layer-manager.store";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { BaseLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { DialogZLevel } from "@/shared/types/dialog";
import ContextMenuItemGroup from "@/ui/components/context-menu/ContextMenuItemGroup";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { VStack } from "@/ui/components/custom/stack/Stack";
import PanelContainer from "@/ui/components/layout/PanelContainer";
import { Button } from "@/ui/components/shadcn/button";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/ui/components/shadcn/context-menu";
import { ScrollArea } from "@/ui/components/shadcn/scroll-area";
import { useDialogActions } from "@/ui/stores/dialog.store";
import { useActiveTilemapSession } from "@/ui/stores/tilemap-session.store";
import { LayerManagerContextMenu } from "./ContextMenu";
import LayerMenuBar from "./LayerMenuBar";
import LayerNodeRow from "./LayerNodeRow";

const LAYER_MANAGER_CONTEXT_INSTIGATOR_ID = "layer-manager";

export default function LayerManager() {
	const layerViews = useLayerViews();
	const selectedLayers = useSelectedLayers();
	const { setLayerViews, setSelectedLayer, setTargetParentLayer } = useLayerManagerActions();
	const { openDialog } = useDialogActions();
	const activeSession = useActiveTilemapSession();

	const layerManagerRef = useRef<HTMLDivElement>(null);

	const setFocusLayerManager = useCallback((isFocused: boolean) => {
		appKernel.activationContext.setFlag(
			"focusLayerManager",
			isFocused,
			LAYER_MANAGER_CONTEXT_INSTIGATOR_ID,
		);
	}, []);

	const handleLayerManagerPointerDownCapture = useCallback(() => {
		setFocusLayerManager(true);
	}, [setFocusLayerManager]);

	const handleLayerManagerBlurCapture = useCallback((e: FocusEvent<HTMLDivElement>) => {
		const nextFocusedElement = e.relatedTarget as Node | null;

		if (
			nextFocusedElement &&
			layerManagerRef.current?.contains(nextFocusedElement)
		) {
			return;
		}

		setFocusLayerManager(false);
	}, [setFocusLayerManager]);

	useEffect(() => {
		const handleDocumentPointerDown = (e: PointerEvent) => {
			const target = e.target as Node | null;

			if (!target) {
				setFocusLayerManager(false);
				return;
			}

			if (!layerManagerRef.current?.contains(target)) {
				setFocusLayerManager(false);
			}
		};

		document.addEventListener("pointerdown", handleDocumentPointerDown, true);

		return () => {
			document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
			setFocusLayerManager(false);
		};
	}, [setFocusLayerManager]);

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
		activeSession.on("onMarkChange", updateLayerView);

		return () => {
			activeSession.off("onSelectedLayersChanged", setSelectedLayer);
			activeSession.off("onMarkChange", updateLayerView)
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
			TilemapLayerActions.moveLayers(ids, root.id, "inside");
		}
	}, [activeSession])

	const handleDragOver = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	}, [])

	const onOpenChange = useCallback((open: boolean) => {
		if (activeSession) setTargetParentLayer(null);
	}, [activeSession, setTargetParentLayer]);

	return (
		<PanelContainer className="layer-manager">
			<VStack
				className="w-full h-full px-frame-quarter pb-frame-half pt-1 bg-surface relative"
				onDrop={handleContainerDrop}
				onDragOver={handleDragOver}
				ref={layerManagerRef}
				onPointerDownCapture={handleLayerManagerPointerDownCapture}
				onBlurCapture={handleLayerManagerBlurCapture}
			>
				<LayerMenuBar />
				<ContextMenu onOpenChange={onOpenChange}>
					<ContextMenuTrigger asChild>
						<ScrollArea className="w-full h-full min-h-0 shadow-sm bg-surface-base rounded-md inset-shadow-panel border-t-(length:--panel-border-width) border-frame">
							<div className="flex flex-col w-full h-full pb-20">
								{layerViews.map((view) => (
									<LayerNodeRow key={view.id} view={view} isSelected={selectedLayers.includes(view.id)} updatedLayerView={updateLayerView} />
								))}
							</div>
						</ScrollArea>
					</ContextMenuTrigger>
					<ContextMenuContent className={LayerManagerContextMenu.className}>
						<ContextMenuItemGroup groups={LayerManagerContextMenu.groups} />
					</ContextMenuContent>
				</ContextMenu>
				{!activeSession && (
					<VStack className="top-0 left-0 right-0 bottom-0 absolute" justify="center" align="center">
						<span className="text-sm">
							<LocalizedText message="workspace.tilemapEditor.empty" />
						</span>
						<Button variant={"link"} onClick={() => openDialog("OPEN_FILE_DIALOG", { zLevel: DialogZLevel.Modal }, { panel: "tilemap" })}>
							<LocalizedText message="workspace.tilemapEditor.open" />
						</Button>
					</VStack>
				)}
			</VStack>
		</PanelContainer>

	);
}
