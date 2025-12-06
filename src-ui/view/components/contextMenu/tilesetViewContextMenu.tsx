import { Ellipsis, Pen, Plus, Trash } from "lucide-react";
import { useCallback } from "react";

import { TilesetService } from "@/shared/services/tilesetService";
import { Button } from "@/view/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/view/components/shadcn/dropdown-menu";

export default function TilesetViewDropDownMenu() {
    const editTileset = useCallback(() => {

    }, [])
    
    return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="default" size={"icon_sm"}>
					<Ellipsis />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="start">
				<DropdownMenuGroup>
					<DropdownMenuItem onSelect={TilesetService.createTileset} >
						<Plus />
						New Tileset
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={editTileset} >
						<Pen />
						Edit Tileset
					</DropdownMenuItem>
					<DropdownMenuItem variant="destructive" onSelect={TilesetService.deleteViewTileset} >
						<Trash />
						Delete Tileset
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
