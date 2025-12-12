
import { VStack } from "../../custom/stack/stack";
import TilesetViewCanvas from "./tilesetViewCanvas";
import TilesetViewTabs from "./tilesetViewTabs";

export default function TilesetView() {
	return (
		<VStack className="tilesetview w-full h-full">
			<TilesetViewCanvas />
			<TilesetViewTabs />
		</VStack>
	);
}