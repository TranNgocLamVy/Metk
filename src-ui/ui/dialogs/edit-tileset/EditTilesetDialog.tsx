import { useEffect, useMemo } from "react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { Tileset } from "@/editor/model/tileset/tileset";
import { BaseDialogProps } from "@/ui/components/dialog/dialogRegistry";
import { HStack } from "@/ui/components/custom/stack/Stack";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/ui/components/shadcn/dialog";

import { EditTilesetContext, useTilesetController } from "./ContextProvider";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { MiddlePanel } from "./MiddlePanel";

interface EditTilesetDialogProps extends BaseDialogProps {
    dialogId: string;
    tilesetId?: string;
    tileset?: {
        id: string;
    };
}

export function EditTilesetDialog({ dialogId, tilesetId, tileset }: EditTilesetDialogProps) {
    const sourceTilesetId = tilesetId ?? tileset?.id;

    const clonedTileset = useMemo(() => {
        if (!sourceTilesetId) return null;

        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return null;

        return currentProject.tilesetManager.deepCloneTileset(sourceTilesetId);
    }, [sourceTilesetId]);

    useEffect(() => {
        if (!clonedTileset) return;
        return () => {
            clonedTileset.destroy();
        };
    }, [clonedTileset]);

    if (!clonedTileset) return null;

    return (
        <EditTilesetDialogContainer
            dialogId={dialogId}
            clonedTileset={clonedTileset}
        />
    );
}

function EditTilesetDialogContainer({ dialogId, clonedTileset }: { dialogId: string; clonedTileset: Tileset }) {
    const controller = useTilesetController(clonedTileset, dialogId);

    return (
        <EditTilesetContext.Provider value={controller}>
            <Dialog open onOpenChange={controller.actions.closeDialog}>
                <DialogContent
                    className="w-full h-full max-w-none p-4 bg-transparent"
                    onInteractOutside={(event) => event.preventDefault()}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    showCloseButton={false}
                >
                    <DialogTitle className="hidden"><LocalizedText message={"Edit Tileset"} /></DialogTitle>

                    <HStack className="w-full h-full min-h-0 gap-4">
                        <LeftPanel />
                        <MiddlePanel />
                        <RightPanel />
                    </HStack>
                </DialogContent>
            </Dialog>
        </EditTilesetContext.Provider>
    );
}
