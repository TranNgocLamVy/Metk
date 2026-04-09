import { VStack } from "../../custom/stack/Stack";
import TilesetViewCanvas from "./TilesetViewCanvas";
import TilesetViewTabs from "./TilesetViewTabs";

export default function TilesetView() {
	return (
		<VStack className="tilesetView h-full bg-secondary-background pt-1">
			<TilesetViewTabs />
			<TilesetViewCanvas />
		</VStack>
	);
}
