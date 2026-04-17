import { VStack } from "../../custom/stack/Stack";
import TilesetViewCanvas from "./TilesetViewCanvas";
import TilesetViewTabs from "./TilesetViewTabs";

export default function TilesetView() {
	return (
		<VStack className="tilesetView h-full px-1 py-2 bg-surface">
			<TilesetViewTabs />
			<TilesetViewCanvas />
		</VStack>
	);
}
