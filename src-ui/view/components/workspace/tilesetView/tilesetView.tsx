
import { VStack } from "../../custom/stack/stack";
import TilesetViewCanvas from "./tilesetViewCanvas";
import TilesetViewTabs from "./tilesetViewTabs";

export default function TilesetView() {
	return (
		<VStack className="tilesetView w-full h-full">
            <span className="font-bold text-sm p-1 uppercase">Tilesets</span>
			<TilesetViewTabs />
			<TilesetViewCanvas />
		</VStack>
	);
}