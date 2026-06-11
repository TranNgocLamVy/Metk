import { useEffect, useMemo, useState } from "react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { Tileset } from "@/editor/model/tileset/tileset";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { BaseDialogProps } from "@/ui/components/dialog/dialogRegistry";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/ui/components/shadcn/dialog";

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { EditTilesetContext, useTilesetController } from "./ContextProvider";
import { LeftPanel } from "./LeftPanel";
import { MiddlePanel } from "./MiddlePanel";
import { RightPanel } from "./RightPanel";
import { EditTilesetSession } from "./graphics/edit-tileset.session";

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
        <EditTilesetDialogContainer dialogId={dialogId} clonedTileset={clonedTileset} />
    );
}

function EditTilesetDialogContainer({ dialogId, clonedTileset }: { dialogId: string; clonedTileset: Tileset }) {
    const controller = useTilesetController(clonedTileset, dialogId);

    const [editSession] = useState(() => {
            return new EditTilesetSession(
                dialogId,
                clonedTileset,
                appKernel.editorFacade,
                controller.triggerUpdate,
            );
        });
        
        useEffect(() => {
            const editorFacade = appKernel.editorFacade;
        
            editorFacade.pushFocusedEditorSession(editSession);
            editorFacade.activationContext.setFlag("undoableDialogOpen", true, dialogId);
        
            return () => {
                editorFacade.removeFocusedEditorSession(editSession.id);
                editorFacade.activationContext.setFlag("undoableDialogOpen", false, dialogId);
                editSession.destroy();
            };
        }, [dialogId, editSession]);

    return (
        <EditTilesetContext.Provider value={controller}>
            <Dialog open onOpenChange={controller.actions.closeDialog}>
                <DialogContent
                    className="w-full h-full max-w-none p-4 bg-transparent"
                    onInteractOutside={(event) => event.preventDefault()}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    showCloseButton={false}
                >
                    <DialogTitle className="hidden"><LocalizedText message="dialog.editTileset.title" /></DialogTitle>

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
