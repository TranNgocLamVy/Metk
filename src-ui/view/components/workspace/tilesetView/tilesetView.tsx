import { VStack } from "../../custom/stack/stack";
import TilesetViewCanvas from "./tilesetViewCanvas";
import TilesetViewTabs from "./tilesetViewTabs";

export default function TilesetView() {
	return (
		<VStack className="tilesetView h-full bg-secondary-background pt-1">
			<TilesetViewTabs />
			<TilesetViewCanvas />
		</VStack>
	);
}
