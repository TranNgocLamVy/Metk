import { Pen, Plus, Trash2 } from "lucide-react";
import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import QuickToolTip from "../../custom/QuickToolTip";
import { TilesetService } from "@/shared/services/tileset.service";
import { useCallback } from "react";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { DialogService } from "@/shared/services/dialog.service";

export default function TilesetMenuBar() {
    const { activeSession } = useTilesetSessionStore();

    const onEditTileset = useCallback(() => {
        const tilesetSession = appKernel.editorFacade.getActiveTilesetSession();
        if (!tilesetSession) return;
    
        DialogService.openEditTilesetDialog(tilesetSession.tileset.id);
    }, []);

    const onDeleteTileset = useCallback(() => {
        const tilesetSession = appKernel.editorFacade.getActiveTilesetSession();
        if (!tilesetSession) return;
        const selectedTilesetId = tilesetSession.tileset.id;
        TilesetService.deleteTileset(selectedTilesetId);
    }, [])

    return (
        <HStack className="bg-surface w-full gap-0.5 pt-1">
            <QuickToolTip toolTip={"workspace.tilesetSelector.menu.new"}>
                <Button variant={"ghost"} size={"icon-sm"} onClick={TilesetService.createTileset}>
                    <Plus />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.tilesetSelector.menu.edit"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!activeSession?.id} onClick={onEditTileset}>
                    <Pen />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.tilesetSelector.menu.delete"}>
                <Button variant={"ghost"} size={"icon-sm"} className="text-destructive" disabled={!activeSession?.id} onClick={onDeleteTileset}>
                    <Trash2 />
                </Button>
            </QuickToolTip>
        </HStack>
    )
}