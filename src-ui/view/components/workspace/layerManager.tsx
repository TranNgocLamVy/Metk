import { Eye, EyeOff, Lock } from "lucide-react";

import { useTilemapLayerStore } from "@/view/stores/application/tilemapLayerStore";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";

// src-ui/view/components/workspace/layerManager.tsx
import { LayerManagerContextMenu } from "../contextMenu/layerManagerContextMenu";
import { HStack, VStack } from "../custom/stack/stack";
import { cn } from "../shadcn/utils/shadcn-utils";

export default function LayerManager() {
	const { currentSession } = useTilemapSessionStore();
    const { activeLayerId, setActiveLayer } = useTilemapLayerStore();

	if (!currentSession) {
		return (
			<VStack className="w-full h-full bg-secondary-background" justify="center" align="center">
				<span className="text-muted-foreground text-sm">No Active Tilemap</span>
			</VStack>
		);
	}

	const layers = currentSession.session.tilemap.rootLayer.getLayers();

	// Đảo ngược danh sách để layer trên cùng hiển thị đầu tiên (như Photoshop)
	const displayLayers = [...layers].reverse();

	return (
		<VStack className="w-full h-full bg-secondary-background border-l border-border">
			<HStack className="w-full h-fit bg-background" justify="between" align="center">
				<LayerManagerContextMenu />
			</HStack>
			<span className="font-bold text-sm p-2">LAYERS</span>

			<VStack className="p-2 gap-1">
				{displayLayers.map((layer) => {
					const isActive = layer.id === activeLayerId;
					return (
						<div key={layer.id} className={cn("group flex items-center w-full h-9 px-2 rounded-md cursor-pointer transition-colors border border-transparent", isActive ? "bg-primary/20 border-primary/50" : "hover:bg-accent")} onClick={() => setActiveLayer(layer.id)}>
							{/* Visibility Icon */}
							{/* Layer Name */}
							<span className={cn("flex-1 text-sm truncate select-none", isActive && "font-medium")}>{layer.getName()}</span>
						</div>
					);
				})}
			</VStack>
		</VStack>
	);
}
