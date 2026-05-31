import { v4 as uuidv4 } from "uuid";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { EntityCollectionStorageService } from "@/infrastructure/container";
import { EntityCollectionData } from "@/shared/data-types/entity-collection.data";
import { Result } from "@/shared/types/result";
import { FileDialogUtils } from "@/shared/utils/file-dialog.utils";
import { PathUtils } from "@/shared/utils/path.utils";
import { DialogService } from "@/shared/services/dialog.service";
import { Console } from "@/shared/services/console.service";
import i18n from "@/shared/services/i18n.service";
import { createEntityCollectionForm } from "@/shared/constant/form/create-entity-collection.form";
import { WorkspaceService } from "./workspace.service";
import { useEntityCollectionStore } from "@/ui/stores/entity-collection.store";
import { normalizeEntityCollectionData } from "@/editor/model/entity/entity.normalizer";

export class EntityCollectionService {
    public static async createEntityCollection(): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return;

        const form = await DialogService.openFormDialog(createEntityCollectionForm);
        if (!form) return;

        const entityCollectionAbsPath = await FileDialogUtils.saveFile({
            title: i18n.t("dialog.save.entityCollection.title"),
            defaultPath: currentProject.projectPathSystem.absDir,
            filters: [
                {
                    name: "Entity Collection",
                    extensions: ["ec.json"],
                },
            ],
        });

        if (!entityCollectionAbsPath) return;

        const now = new Date().toISOString();

        const createEntityCollectionPayload: EntityCollectionData = {
            id: uuidv4(),
            name: form.entityCollection.name,
            entities: [],
            createdAt: now,
            updatedAt: now,
        };

        let entityCollectionData: EntityCollectionData;
        try {
            entityCollectionData = normalizeEntityCollectionData(createEntityCollectionPayload);
        } catch (error) {
            Console.error({ message: "message.entityCollection.createFail", stacks: [String(error)]});
            return;
        }

        const saveResult = await EntityCollectionStorageService.save(
            entityCollectionAbsPath,
            entityCollectionData,
        );

        if (saveResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.entityCollection.saveFail",
                stacks: saveResult.message ? [saveResult.message] : [],
            });
            return;
        }

        const addResult = await currentProject.entityCollectionManager.addEntityCollection(
            entityCollectionData,
            entityCollectionAbsPath,
        );

        if (addResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.entityCollection.createFail",
                stacks: addResult.message ? [addResult.message] : [],
            });
            return;
        }

        await editorFacade.projectManager.saveCurrrentProject();
        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        EntityCollectionService.selectEntityCollection(entityCollectionData.id);

        Console.success({ message: "message.entityCollection.createSuccess" });
    }

    public static selectEntityCollection(entityCollectionId: string | null): void {
        const currentProject = appKernel.editorFacade.currentProject;

        if (entityCollectionId) {
            currentProject?.entityCollectionManager.loadEntityCollection(entityCollectionId);
        }

        useEntityCollectionStore.getState().setSelectedEntityCollectionId(entityCollectionId);
    }

    public static async deleteEntityCollection(entityCollectionId: string): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;

        if (!currentProject) return;

        const confirmDeletion = await DialogService.openPermissionDialog({
            title: "dialog.delete.entityCollection.title",
            description: "dialog.delete.entityCollection.description",
        });

        if (!confirmDeletion) return;

        const deleteResult = await currentProject.entityCollectionManager.deleteEntityCollection(
            entityCollectionId,
        );

        if (deleteResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.entityCollection.deleteFail",
                stacks: deleteResult.message ? [deleteResult.message] : [],
            });
            return;
        }

        const currentSelectedId =
            useEntityCollectionStore.getState().selectedEntityCollectionId;

        if (currentSelectedId === entityCollectionId) {
            useEntityCollectionStore.getState().setSelectedEntityCollectionId(null);
        }

        await editorFacade.projectManager.saveCurrrentProject();
        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async createEntity() {

    }

    public static async deleteEntity() {

    }
}