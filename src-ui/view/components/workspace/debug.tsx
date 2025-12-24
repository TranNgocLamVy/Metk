
import { AppCore } from "@/core/appcore";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";

import { HStack, VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function Debug() {
	const print = async () => {
        const workspace = AppCore.getCurrentWorkspace().serialize();
        console.log(workspace)
	};

    const saveCurrentTilemap = async () => {
        const { currentSession } = useTilemapSessionStore.getState();
        if (currentSession) {
            const tilemap = currentSession.session.tilemap;
            const project = AppCore.getCurrentProject();
            await project.tilemapManager.saveTilemap(tilemap.id);
        }
    }

	return (
		<VStack className="w-full h-full ">
			<HStack className="w-full h-full bg-secondary-background p-4 gap-2" justify="start" align="start">
				<Button onClick={print}>Print</Button>
				<Button onClick={saveCurrentTilemap}>Save current Tilemap</Button>
			</HStack>
		</VStack>
	);
}
