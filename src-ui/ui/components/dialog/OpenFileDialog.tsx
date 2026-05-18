import { appCore } from "@/editor/appcore";
import { WorkspaceService } from "@/shared/services/workspaceService";
import { useDialogStore } from "@/ui/stores/dialogStore";
import { BaseDialogProps } from "./dialogRegistry";
import { LocalizedText } from "../custom/LocalizeText";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../shadcn/dialog";
import { VStack } from "../custom/stack/Stack";

interface OpenFileModalProps extends BaseDialogProps {
    dialogId: string;
}

export function OpenFileDialog({ dialogId }: OpenFileModalProps) {
    const { closeDialog } = useDialogStore();

    const currentProject = appCore.editorContext.currentProject;
    if (!currentProject) return null;

    const tilemaps = currentProject.tilemapManager.serialize();
    const tilesets = currentProject.tilesetManager.serialize();

    const onOpenTilemap = (tilemapId: string) => {
        WorkspaceService.createTilemapSession(tilemapId);
        closeDialog(dialogId);
    }

    const onOpenTileset = (tilesetId: string) => {
        WorkspaceService.createTilesetSession(tilesetId);
    }

    const onOpenChange = (open: boolean) => {
        closeDialog(dialogId);
    }

    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogHeader>
                <DialogTitle><LocalizedText message="dialog.openFile.title" /></DialogTitle>
                <DialogDescription><LocalizedText message="dialog.openFile.description" /></DialogDescription>
            </DialogHeader>
            <DialogContent className="w-120 min-h-80">
                <VStack className="gap-6">
                    <VStack className="gap-2">
                        <span><LocalizedText message="dialog.openFile.tilemap" /></span>
                        {tilemaps.map((tilemap) => {
                            return (
                                <div key={tilemap.id} onClick={() => onOpenTilemap(tilemap.id)} className="w-full h-fit p-2 hover:bg-surface-overlay-sunken cursor-pointer">
                                    <span className="text-xs">{tilemap.name}</span>
                                </div>
                            )
                        })}
                    </VStack>
                    <VStack className="gap-2">
                        <span><LocalizedText message="dialog.openFile.tileset" /></span>
                        {tilesets.map((tileset) => {
                            return (
                                <div key={tileset.id} onClick={() => onOpenTileset(tileset.id)} className="w-full h-fit p-2 hover:bg-surface-overlay-sunken cursor-pointer">
                                    <span className="text-xs">{tileset.name}</span>
                                </div>
                            )
                        })}
                    </VStack>
                </VStack>
            </DialogContent>
        </Dialog>
    )
}