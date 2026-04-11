import { useDialogStore } from "@/view/stores/dialogStore";
import { BaseDialogProps } from "./dialogRegistry";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Dialog, DialogClose } from "../shadcn/dialog";
import { Button } from "../shadcn/button";

interface EditTilesetDialogProps extends BaseDialogProps {
    dialogId: string;
}

export function EditTilesetDialog({ dialogId }: EditTilesetDialogProps) {
    const { closeDialog } = useDialogStore();

    return (
        <Dialog open onOpenChange={() => closeDialog(dialogId)}>
            <DialogContent className="w-[calc(100%-4em)] max-w-none h-[calc(100%-6em)] mt-4" onInteractOutside={(e) => e.preventDefault()} >
                <DialogHeader>
                    <DialogTitle>{"Edit Tileset"}</DialogTitle>
                </DialogHeader>

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