import { Layers } from "lucide-react";
import { DragEvent, MouseEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { VStack } from "../../custom/stack/stack";
import ContextMenuItemGroup from "../../layout/contextMenuWrapper/contextMenu/contextMenuItemGroup";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "../../shadcn/context-menu";
import { ScrollArea } from "../../shadcn/scroll-area";
import { LayerManagerContextMenu } from "./layerContextMenuItem";
import LayerNodeRow from "./layerNodeRow";

export default function LayerManager() {
	const store = useLayerManagerStore();
	useLayerManagerStore((s) => s.version);
	const selectedIds = useLayerManagerStore((s) => s.selectedIds);

	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const flatView = useMemo(() => {
		return store.getFlatView();
	}, [store.root, store.version]);

	const root = store.root;

	if (!isMounted || !root) {
		return (
			<VStack className="w-full h-full" justify="center" align="center">
				Select a tilemap
			</VStack>
		);
	}

	const onOpenChange = (open: boolean) => {
		if (!open) store.setTargetLayer(null);
	};


	return (
		<VStack className="w-full h-full rounded-md">
			<ContextMenu onOpenChange={onOpenChange}>
				<ContextMenuTrigger className="w-full h-full">
					<ScrollArea onDragOver={(e) => e.preventDefault()} className="w-full h-full">
						{flatView.map((view, index) => (
							<LayerNodeRow key={view.id} view={view} style={{}} isSelected={selectedIds.has(view.id)} />
						))}
					</ScrollArea>
				</ContextMenuTrigger>
				<ContextMenuContent className={LayerManagerContextMenu.className}>
					<ContextMenuItemGroup groups={LayerManagerContextMenu.groups} />
				</ContextMenuContent>
			</ContextMenu>
		</VStack>
	);
}
