import { Pen, Plus, Trash } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/view/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/view/components/shadcn/dropdown-menu";

export function TilesetViewContextMenu() {
	const createNewTileset = useCallback(() => {

    }, [])

    const editTileset = useCallback(() => {

    }, [])

    const deleteTileset = useCallback(() => {

    }, [])
    
    return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="default" size={"icon_sm"}>
					<Plus />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="start">
				<DropdownMenuGroup>
					<DropdownMenuItem onSelect={createNewTileset}>
						<Plus />
						New Tileset
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={editTileset}>
						<Pen />
						Edit Tileset
					</DropdownMenuItem>
					<DropdownMenuItem variant="destructive" onSelect={deleteTileset}>
						<Trash />
						Delete Tileset
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
