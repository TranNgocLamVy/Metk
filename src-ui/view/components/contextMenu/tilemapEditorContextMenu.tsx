import { Ellipsis, Pen, Plus, Trash } from "lucide-react";
import { useCallback } from "react";

import { TilemapService } from "@/shared/services/tilemapService";
import { Button } from "@/view/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/view/components/shadcn/dropdown-menu";

export default function TilemapEditorDropDownMenu() {
    const editTilemap = useCallback(() => {

    }, [])

    const deleteTilemap = useCallback(() => {

    }, [])
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" size={"icon-lg"}>
                    <Ellipsis />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={TilemapService.createTilemap} >
                        <Plus />
                        New Tilemap
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={editTilemap} >
                        <Pen />
                        Edit Tilemap
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={deleteTilemap} >
                        <Trash />
                        Delete Tilemap
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
