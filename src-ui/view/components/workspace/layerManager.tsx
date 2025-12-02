import { LayerManagerContextMenu } from "../contextMenu/layerManagerContextMenu";
import { HStack, VStack } from "../custom/stack/stack";

export default function LayerManager() {
	return (
		<VStack className="tilesetview w-full h-full ">
			<VStack className="w-full h-full bg-secondary-background" justify="center" align="center">
				Layer Manager
			</VStack>
			<HStack className="w-full h-fit bg-background" justify="start" align="center">
				<LayerManagerContextMenu />
			</HStack>
		</VStack>
	);
}
