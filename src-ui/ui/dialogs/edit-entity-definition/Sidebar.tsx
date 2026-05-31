import { useCallback, useState } from "react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { Console } from "@/shared/services/console.service";
import { WorkspaceService } from "@/shared/services/workspace.service";
import { Result } from "@/shared/types/result";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { DialogClose } from "@/ui/components/shadcn/dialog";
import { useDialogStore } from "@/ui/stores/dialog.store";

import { useEditEntityDefinition } from "./ContextProvider";

type EditEntityDefinitionSidebarProps = {
    dialogId: string;
};

export default function EditEntityDefinitionSidebar({ dialogId }: EditEntityDefinitionSidebarProps) {
    const { closeDialog } = useDialogStore();
    const { entity, entityCollection, tilesetRefManager, actions } = useEditEntityDefinition();
    const [name, setName] = useState(entity.name);

    const commitName = useCallback(() => {
        if (name.trim() === "") {
            setName(entity.name);
            return;
        }

        actions.updateEntityName(name);
    }, [actions, entity.name, name]);

    const handleSave = useCallback(async () => {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return;

        const nextName = name.trim() === "" ? entity.name : name;
        actions.updateEntityName(nextName);

        const tilesetRefs = tilesetRefManager.serialize();
        entityCollection.tilesetRefManager.loadData(tilesetRefs.refs, tilesetRefs.nextIndex);

        if (entity.graphic.type === "tile" && entity.graphic.tilesetId) {
            entityCollection.tilesetRefManager.getTilesetRefIndex(entity.graphic.tilesetId);
        }

        const updated = entityCollection.updateEntityDefinition(entity.serialize());
        if (!updated) {
            Console.error({ message: "message.entityCollection.entityEditFail" });
            return;
        }

        currentProject.entityCollectionManager.notifyEntityCollectionUpdated(entityCollection.id);

        const saveResult = await currentProject.entityCollectionManager.saveEntityCollection(entityCollection.id);
        if (saveResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.entityCollection.saveFail",
                stacks: saveResult.message ? [saveResult.message] : [],
            });
            return;
        }

        await editorFacade.projectManager.saveCurrrentProject();
        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        Console.success({
            message: {
                key: "message.entityCollection.entityEditSuccess",
                options: { name: entity.name },
            },
        });

        closeDialog(dialogId);
    }, [actions, closeDialog, dialogId, entity, entityCollection, name, tilesetRefManager]);

    return (
        <VStack className="w-72 h-full bg-surface-overlay p-2 gap-2">
            <VStack className="gap-2">
                <label className="text-xs text-muted-foreground">
                    <LocalizedText message="dialog.editEntity.name" />
                </label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={commitName}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") commitName();
                    }}
                    className="text-sm w-full border border-foreground/20 py-1 px-2 focus:outline-1 focus:outline-foreground bg-surface-overlay-sunken"
                />
            </VStack>

            <div className="flex-1" />

            <HStack className="w-full h-fit gap-2">
                <DialogClose asChild>
                    <Button variant="outline" type="button" onClick={() => closeDialog(dialogId)} className="ml-auto">
                        <LocalizedText message="dialog.editEntity.action.discard" />
                    </Button>
                </DialogClose>
                <Button type="button" onClick={handleSave}>
                    <LocalizedText message="dialog.editEntity.action.save" />
                </Button>
            </HStack>
        </VStack>
    );
}
