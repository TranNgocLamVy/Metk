import { WorkspaceService } from "@/shared/services/workspaceService";
import { useExplorerStore } from "@/view/stores/application/explorerStore";

import { VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function Explorer() {
    const { tilesets } = useExplorerStore();

    return (
        <div className="tilesetview w-full h-full bg-secondary-background">
            <VStack className="w-full h-full p-4 gap-2">
                {tilesets.map((tileset) => {
                    return (
                        <Button key={tileset.id} onClick={() => WorkspaceService.createTilesetSession(tileset.id)}>
                            {tileset.name}
                        </Button>
                    );
                })}
            </VStack>
        </div>
    );
}