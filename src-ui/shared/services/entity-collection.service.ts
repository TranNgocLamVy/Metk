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
import { EntityCollection } from "@/editor/model/entity/entity-collection";
import { EntityDefinitionData } from "@/shared/data-types/entity.data";

export class EntityCollectionService {
    private static readonly defaultEntityData: Omit<EntityDefinitionData, "id"> = {
        name: "New Entity",
        width: 1,
        height: 1,
        graphic: {
            type: "color",
            color: "#ffffff",
        },
        color: "#ffffff",
        pivotX: 0,
        pivotY: 0,
        tags: [],
        fields: [],
    };

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
            tilesets: {
                refs: [],
                nextIndex: 0,
            },
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

        await EntityCollectionService.selectEntityCollection(entityCollectionData.id);

        Console.success({ message: "message.entityCollection.createSuccess" });
    }

    public static async selectEntityCollection(entityCollectionId: string | null): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return;

        if (entityCollectionId) {
            const loadResult = await currentProject.entityCollectionManager.loadEntityCollection(entityCollectionId);
            if (loadResult.status !== Result.Status.Success) {
                Console.error({
                    message: "message.entityCollection.loadFail",
                    stacks: loadResult.message ? [loadResult.message] : [],
                });
                return;
            }
        }

        const state = useEntityCollectionStore.getState();
        const selectionChanged = state.selectedEntityCollectionId !== entityCollectionId;

        state.setSelectedEntityCollectionId(entityCollectionId);

        if (selectionChanged || entityCollectionId === null) {
            state.setSelectedEntityId(null);
        }

        currentWorkspace.entityCollectionSessionManager.setSelectedEntityCollectionId(entityCollectionId);
        if (selectionChanged || entityCollectionId === null) {
            currentWorkspace.entityCollectionSessionManager.resetSelectedEntityId();
        }

        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async selectEntity(entityId: string | null): Promise<void> {
        const currentWorkspace = appKernel.editorFacade.currentWorkspace;
        if (!currentWorkspace) return;

        useEntityCollectionStore.getState().setSelectedEntityId(entityId);
        currentWorkspace.entityCollectionSessionManager.setSelectedEntityId(entityId);

        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
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
            await EntityCollectionService.selectEntityCollection(null);
        }

        await editorFacade.projectManager.saveCurrrentProject();
        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static async createEntity(): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return;

        const entityCollectionId =
            useEntityCollectionStore.getState().selectedEntityCollectionId ??
            currentWorkspace.entityCollectionSessionManager.getSelectedEntityCollectionId();

        if (!entityCollectionId) {
            Console.error({ message: "message.entityCollection.entityCreateFail" });
            return;
        }

        const entityCollection = await EntityCollectionService.loadEntityCollection(entityCollectionId);
        if (!entityCollection) {
            Console.error({ message: "message.entityCollection.entityCreateFail" });
            return;
        }

        const entity = entityCollection.addEntityDefinition(EntityCollectionService.defaultEntityData);

        currentProject.entityCollectionManager.notifyEntityCollectionUpdated(entityCollectionId);

        await EntityCollectionService.selectEntity(entity.id);

        const saved = await EntityCollectionService.saveEntityCollectionChanges(entityCollectionId);
        if (!saved) return;

        Console.success({
            message: {
                key: "message.entityCollection.entityCreateSuccess",
                options: { name: entity.name },
            },
        });

        await DialogService.openEditEntityDefinitionDialog(entityCollectionId, entity.id);
    }

    public static async editEntity(entityCollectionId?: string, entityId?: string): Promise<void> {
        const resolvedIds = EntityCollectionService.resolveEntityIds(entityCollectionId, entityId);
        if (!resolvedIds) {
            Console.error({ message: "message.entityCollection.entityEditFail" });
            return;
        }

        const entityCollection = await EntityCollectionService.loadEntityCollection(resolvedIds.entityCollectionId);
        if (!entityCollection) {
            Console.error({ message: "message.entityCollection.entityEditFail" });
            return;
        }

        const entity = entityCollection.getEntityDefinitionById(resolvedIds.entityId);
        if (!entity) {
            Console.error({
                message: "message.entityCollection.entityEditFail",
                stacks: [{
                    key: "message.entityCollection.entityNotFound",
                    options: { id: resolvedIds.entityId },
                }],
            });
            return;
        }

        await DialogService.openEditEntityDefinitionDialog(resolvedIds.entityCollectionId, resolvedIds.entityId);
    }

    public static async deleteEntity(entityCollectionId?: string, entityId?: string): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return;

        const resolvedIds = EntityCollectionService.resolveEntityIds(entityCollectionId, entityId);
        if (!resolvedIds) {
            Console.error({ message: "message.entityCollection.entityDeleteFail" });
            return;
        }

        const entityCollection = await EntityCollectionService.loadEntityCollection(resolvedIds.entityCollectionId);
        if (!entityCollection) {
            Console.error({ message: "message.entityCollection.entityDeleteFail" });
            return;
        }

        const entity = entityCollection.getEntityDefinitionById(resolvedIds.entityId);
        if (!entity) {
            Console.error({
                message: "message.entityCollection.entityDeleteFail",
                stacks: [{
                    key: "message.entityCollection.entityNotFound",
                    options: { id: resolvedIds.entityId },
                }],
            });
            return;
        }

        const confirmDeletion = await DialogService.openPermissionDialog({
            title: "dialog.delete.entity.title",
            description: "dialog.delete.entity.description",
        });

        if (!confirmDeletion) return;

        const removed = entityCollection.removeEntityDefinition(resolvedIds.entityId);
        if (!removed) {
            Console.error({ message: "message.entityCollection.entityDeleteFail" });
            return;
        }

        currentProject.entityCollectionManager.notifyEntityCollectionUpdated(resolvedIds.entityCollectionId);

        if (useEntityCollectionStore.getState().selectedEntityId === resolvedIds.entityId) {
            await EntityCollectionService.selectEntity(null);
        }

        const saved = await EntityCollectionService.saveEntityCollectionChanges(resolvedIds.entityCollectionId);
        if (!saved) return;

        Console.success({
            message: {
                key: "message.entityCollection.entityDeleteSuccess",
                options: { name: entity.name },
            },
        });
    }

    public static async cloneEntity(entityCollectionId?: string, entityId?: string): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;

        if (!currentProject) return;

        const resolvedIds = EntityCollectionService.resolveEntityIds(entityCollectionId, entityId);
        if (!resolvedIds) {
            Console.error({ message: "message.entityCollection.entityCloneFail" });
            return;
        }

        const entityCollection = await EntityCollectionService.loadEntityCollection(resolvedIds.entityCollectionId);
        if (!entityCollection) {
            Console.error({ message: "message.entityCollection.entityCloneFail" });
            return;
        }

        const clonedEntity = entityCollection.duplicateEntityDefinition(resolvedIds.entityId);
        if (!clonedEntity) {
            Console.error({
                message: "message.entityCollection.entityCloneFail",
                stacks: [{
                    key: "message.entityCollection.entityNotFound",
                    options: { id: resolvedIds.entityId },
                }],
            });
            return;
        }

        currentProject.entityCollectionManager.notifyEntityCollectionUpdated(resolvedIds.entityCollectionId);

        await EntityCollectionService.selectEntity(clonedEntity.id);

        const saved = await EntityCollectionService.saveEntityCollectionChanges(resolvedIds.entityCollectionId);
        if (!saved) return;

        Console.success({
            message: {
                key: "message.entityCollection.entityCloneSuccess",
                options: { name: clonedEntity.name },
            },
        });

        await DialogService.openEditEntityDefinitionDialog(resolvedIds.entityCollectionId, clonedEntity.id);
    }

    private static resolveEntityIds(entityCollectionId?: string, entityId?: string): { entityCollectionId: string; entityId: string } | null {
        const state = useEntityCollectionStore.getState();
        const resolvedEntityCollectionId = entityCollectionId ?? state.selectedEntityCollectionId;
        const resolvedEntityId = entityId ?? state.selectedEntityId;

        if (!resolvedEntityCollectionId || !resolvedEntityId) return null;

        return {
            entityCollectionId: resolvedEntityCollectionId,
            entityId: resolvedEntityId,
        };
    }

    private static async loadEntityCollection(entityCollectionId: string): Promise<EntityCollection | null> {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return null;

        const loadResult = await currentProject.entityCollectionManager.loadEntityCollection(entityCollectionId);

        if (loadResult.status !== Result.Status.Success) {
            Console.error({
                message: {
                    key: "message.entityCollection.loadFail",
                    options: { name: "Unknown", id: entityCollectionId },
                },
                stacks: loadResult.message ? [loadResult.message] : [],
            });
            return null;
        }

        return loadResult.data;
    }

    private static async saveEntityCollectionChanges(entityCollectionId: string): Promise<boolean> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;

        if (!currentProject) return false;

        const saveResult = await currentProject.entityCollectionManager.saveEntityCollection(entityCollectionId);
        if (saveResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.entityCollection.saveFail",
                stacks: saveResult.message ? [saveResult.message] : [],
            });
            return false;
        }

        await editorFacade.projectManager.saveCurrrentProject();
        await WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        return true;
    }
}
