import { useEffect, useMemo, useState } from "react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { EntityCollection } from "@/editor/model/entity/entity-collection";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { BaseDialogProps } from "@/ui/components/dialog/dialogRegistry";
import { Dialog, DialogContent, DialogTitle } from "@/ui/components/shadcn/dialog";
import { useDialogActions } from "@/ui/stores/dialog.store";

import { EditEntityDefinitionContext, useEntityDefinitionController } from "./ContextProvider";
import EntityDefinitionGraphicSelector from "./GraphicSelector";
import EditEntityDefinitionSidebar from "./Sidebar";
import { EditEntityDefinitionSession } from "./graphics/edit-entity-definition.session";

interface EditEntityDefinitionDialogProps extends BaseDialogProps {
    dialogId: string;
    entityCollectionId: string;
    entityId: string;
}

export function EditEntityDefinitionDialog({ dialogId, entityCollectionId, entityId }: EditEntityDefinitionDialogProps) {
    const dialogData = useMemo(() => {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return null;

        const entityCollection = currentProject.entityCollectionManager.getEntityCollectionById(entityCollectionId);
        if (!entityCollection) return null;

        const entity = entityCollection.getEntityDefinitionById(entityId);
        if (!entity) return null;

        return {
            entityCollection,
            clonedEntity: new EntityDefinition(entity.serialize()),
        };
    }, [entityCollectionId, entityId]);

    if (!dialogData) return null;

    return (
        <EditEntityDefinitionDialogProvider dialogId={dialogId} entityCollection={dialogData.entityCollection} clonedEntity={dialogData.clonedEntity} />
    );
}

function EditEntityDefinitionDialogProvider({ dialogId, entityCollection, clonedEntity }: { dialogId: string; entityCollection: EntityCollection; clonedEntity: EntityDefinition }) {
    const { closeDialog } = useDialogActions();

    const controller = useEntityDefinitionController(clonedEntity, entityCollection);

    const [editSession] = useState(() => {
        return new EditEntityDefinitionSession(
            dialogId,
            clonedEntity,
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
        <EditEntityDefinitionContext.Provider value={controller}>
            <Dialog open onOpenChange={() => closeDialog(dialogId)}>
                <DialogContent className="w-full h-full flex flex-row p-4 bg-transparent gap-4" onInteractOutside={(e) => e.preventDefault()} showCloseButton={false} onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogTitle className="hidden"><LocalizedText message="dialog.editEntity.title" /></DialogTitle>
                    <EditEntityDefinitionSidebar dialogId={dialogId} />

                    <HStack className="flex-1 gap-4">
                        <VStack className="w-full h-full p-2 bg-surface">
                            <EntityDefinitionGraphicSelector />
                        </VStack>
                    </HStack>
                </DialogContent>
            </Dialog>
        </EditEntityDefinitionContext.Provider>
    );
}
