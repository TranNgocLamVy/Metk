import { Node } from "flexlayout-react";

import { WorkspaceService } from "@/shared/services/workspaceService";
import { useExplorerStore } from "@/view/stores/application/explorerStore";

import { VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";
import { Label } from "../shadcn/label";
import { ScrollArea } from "../shadcn/scroll-area";
import { Separator } from "../shadcn/separator";

type Props = {
	node: Node;
};

export default function Explorer({ node }: Props) {
	const { tilesets, tilemaps } = useExplorerStore();

	return (
		<VStack className="w-full h-full bg-secondary-background">
			<ScrollArea className="w-full h-full p-2 gap-4 bg-background rounded-lg border-2 shadow-sm">
				<VStack className="gap-2">
					<Label className="text-muted-foreground font-bold text-xs uppercase">Tilesets</Label>
					{tilesets.length === 0 && <span className="text-xs text-muted-foreground italic pl-2">No tilesets</span>}
					{tilesets.map((tileset) => (
						<Button key={tileset.id} variant="secondary" className="justify-start w-full text-sm h-8" onClick={() => WorkspaceService.createTilesetSession(tileset.id)}>
							<span className="truncate">{tileset.name}</span>
						</Button>
					))}
				</VStack>

				<Separator />

				{/* Tilemap Section */}
				<VStack className="gap-2">
					<Label className="text-muted-foreground font-bold text-xs uppercase">Tilemaps</Label>
					{tilemaps.length === 0 && <span className="text-xs text-muted-foreground italic pl-2">No tilemaps</span>}
					{tilemaps.map((tilemap) => (
						<Button key={tilemap.id} variant="secondary" className="justify-start w-full text-sm h-8" onClick={() => WorkspaceService.createTilemapSession(tilemap.id)}>
							<span className="truncate">{tilemap.name}</span>
						</Button>
					))}
				</VStack>
			</ScrollArea>
		</VStack>
	);
}
