import { AppCore } from "@/core/appcore";
import { IModal, modal } from "../custom/modalContainer/modalRegistry";
import { Command, CommandGroup, CommandInput, CommandList, CommandSeparator } from "../shadcn/command";
import { WorkspaceService } from "@/shared/services/workspaceService";

@modal("OPEN_FILE")
export class OpenFileModal implements IModal {
    constructor(private props: { title: string; onClose: () => void }) { }

    render() {
        const tilemaps = AppCore.getIns().editorContext.getCurrentProject().tilemapManager.serialize()
        const tilesets = AppCore.getIns().editorContext.getCurrentProject().tilesetManager.serialize()

        const onOpenTilemap = (tilemapId: string) => {
            WorkspaceService.createTilemapSession(tilemapId);
            this.props.onClose();
        }

        const onOpenTileset = (tilesetId: string) => {
            WorkspaceService.createTilesetSession(tilesetId);
            this.props.onClose();
        }

        return (
            <Command onClick={(e) => e.stopPropagation()} className="w-120 h-90 shadow-md border bg-secondary-background p-4 rounded-md gap-2">
                <CommandInput placeholder="Type to seach for files..." />
                <CommandList>
                    {tilemaps.length > 0 && <CommandGroup heading="Tilemaps">
                        {tilemaps.map((tilemap) => {
                            return (
                                <div key={tilemap.id} onClick={() => onOpenTilemap(tilemap.id)} className="w-full h-fit p-2 bg-secondary-background hover:bg-background cursor-pointer">
                                    <span className="text-xs">{tilemap.name}</span>
                                </div>
                            )
                        })}
                    </CommandGroup>}
                    {tilemaps.length > 0 && tilesets.length > 0 && <CommandSeparator className="my-2" />}
                    {tilesets.length > 0 && <CommandGroup heading="Tilesets">
                        {tilesets.map((tileset) => {
                            return (
                                <div key={tileset.id} onClick={() => onOpenTileset(tileset.id)} className="w-full h-fit p-2 bg-secondary-background hover:bg-background cursor-pointer">
                                    <span className="text-xs">{tileset.name}</span>
                                </div>
                            )
                        })}
                    </CommandGroup>}
                </CommandList>
            </Command>
        );
    }
}