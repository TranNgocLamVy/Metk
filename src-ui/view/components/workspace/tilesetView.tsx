import { useEffect, useRef, useState } from "react";

import { AppCore } from "@/core/appcore";
import { Tileset } from "@/core/application/tileset";
import { TilesetService } from "@/shared/services/tilesetService";
import { ToastService } from "@/shared/services/toastService";
import { useHorizontalScroll } from "@/view/hooks/useHorizontalSCroll";
import { TilesetDisplayData, useTilesetViewStore } from "@/view/stores/application/tilesetViewStore";

import TilesetViewDropDownMenu from "../contextMenu/tilesetViewContextMenu";
import { HStack, VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function TilesetView() {
	const ref = useRef<HTMLDivElement>(null);

	const [tileset, setTileset] = useState<Tileset | null>(null);

	const { currentTileset } = useTilesetViewStore();

	useEffect(() => {
		const getTileset = async () => {
			if (currentTileset) {
				const tilesetResult = await AppCore.getIns().getCurrentProject().tilesetManager.getTilesetById(currentTileset.id);
                if (tilesetResult.status === "Success") {
                    const tileset = tilesetResult.data;
                    setTileset(tileset);
                }
			}
		};
        getTileset();
	}, [currentTileset]);

	useHorizontalScroll(ref);

	const { tilesets } = useTilesetViewStore();

	return (
		<VStack className="tilesetview w-full h-full ">
			<VStack className="w-full h-full bg-secondary-background" justify="center" align="center">
                {tileset ? `${tileset.name}` : "No Tileset"}
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
		<Button key={id} onClick={() => TilesetService.openTilesetView(id)} size={"sm"} className="rounded-none bg-background text-foreground hover:bg-secondary-background cursor-pointer">
			{name}
		</Button>
	);
};
