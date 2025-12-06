import { useRef } from "react";

import { TilesetService } from "@/shared/services/tilesetService";
import { useHorizontalScroll } from "@/view/hooks/useHorizontalSCroll";
import { TilesetDisplayData, useTilesetViewStore } from "@/view/stores/application/tilesetViewStore";

import TilesetViewDropDownMenu from "../contextMenu/tilesetViewContextMenu";
import { HStack, VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function TilesetView() {
	const ref = useRef<HTMLDivElement>(null);

	useHorizontalScroll(ref);

	const { tilesets } = useTilesetViewStore();

	return (
		<VStack className="tilesetview w-full h-full ">
			<VStack className="w-full h-full bg-secondary-background" justify="center" align="center">
				Tileset view
			</VStack>
			<HStack className="w-full h-fit bg-background" justify="start" align="center">
				<TilesetViewDropDownMenu />
				<div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar gap-0">
					{tilesets.map((tileset) => (
						<TileSetTab key={tileset.id} id={tileset.id} name={tileset.name} />
					))}
				</div>
			</HStack>
		</VStack>
	);
}

const TileSetTab = ({ name, id }: TilesetDisplayData) => {
	const { currentTileset } = useTilesetViewStore();

	if (currentTileset?.id === id) {
		return (
			<Button key={id} size={"sm"} className="border-b-2 border-b-foreground rounded-none bg-secondary-background text-foreground hover:bg-secondary-background cursor-pointer">
				{name}
			</Button>
		);
	}

	return (
		<Button key={id} onClick={() => TilesetService.openViewTileset(id)} size={"sm"} className="rounded-none bg-background text-foreground hover:bg-secondary-background cursor-pointer">
			{name}
		</Button>
	);
};
