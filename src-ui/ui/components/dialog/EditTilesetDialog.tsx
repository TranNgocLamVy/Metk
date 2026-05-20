import { useDialogStore } from "@/ui/stores/dialog.store";
import { BaseDialogProps } from "./dialogRegistry";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Dialog, DialogClose } from "../shadcn/dialog";
import { Button } from "../shadcn/button";

interface EditTilesetDialogProps extends BaseDialogProps {
    dialogId: string;
    tileset?: {
        id: string;
        name: string;
        columns?: number;
        rows?: number;
        tilewidth?: number;
        tileheight?: number;
        image?: {
            source?: string;
            width?: number;
            height?: number;
        };
    };
}

export function EditTilesetDialog({ dialogId, tileset }: EditTilesetDialogProps) {
    const { closeDialog } = useDialogStore();

    return (
        <Dialog open onOpenChange={() => closeDialog(dialogId)}>
            <DialogContent className="w-[calc(100%-4em)] max-w-none h-[calc(100%-6em)] mt-4" onInteractOutside={(e) => e.preventDefault()} >
                <DialogHeader>
                    <DialogTitle>{"Edit Tileset"}</DialogTitle>
                    {tileset && (
                        <DialogDescription>
                            {tileset.name}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {tileset && (
                    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-xs">
                        <dt className="text-muted-foreground">ID</dt>
                        <dd>{tileset.id}</dd>
                        <dt className="text-muted-foreground">Grid</dt>
                        <dd>{tileset.columns ?? 0} x {tileset.rows ?? 0}</dd>
                        <dt className="text-muted-foreground">Tile Size</dt>
                        <dd>{tileset.tilewidth ?? 0} x {tileset.tileheight ?? 0}</dd>
                        {tileset.image?.source && (
                            <>
                                <dt className="text-muted-foreground">Image</dt>
                                <dd>{tileset.image.source}</dd>
                            </>
                        )}
                    </dl>
                )}

                <DialogFooter className="mt-auto">
                    <DialogClose asChild>
                        <Button variant="outline" type="button" onClick={() => closeDialog(dialogId)}>Cancel</Button>
                    </DialogClose>
                    <Button type="button">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
