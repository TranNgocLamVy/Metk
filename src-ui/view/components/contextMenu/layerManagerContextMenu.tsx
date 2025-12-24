import { Pen, Plus, Trash } from "lucide-react";
import { useCallback } from "react";

import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { Button } from "@/view/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/view/components/shadcn/dropdown-menu";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";

export function LayerManagerContextMenu() {
    const { currentSession } = useTilemapSessionStore()

    const createNewlayer = useCallback(() => {
        if (!currentSession) return;
        TilemapLayerService.createLayer("New Layer", currentSession.session.tilemap);
    }, [currentSession])

    const editlayer = useCallback(() => {

    }, [])

    const deletelayer = useCallback(() => {

    }, [])
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" size={"icon-sm"}>
                    <Plus />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start" >
                <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={createNewlayer}>
                        <Plus />
                        New layer
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={editlayer}>
                        <Pen />
                        Edit layer
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={deletelayer}>
                        <Trash />
                        Delete layer
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
