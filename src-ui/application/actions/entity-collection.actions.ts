import { v4 as uuidv4 } from "uuid";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { EntityCollectionStorageService, FileDialogService } from "@/infrastructure/container";
import { EntityCollectionData } from "@/shared/data-types/entity-collection.data";
import { Result } from "@/shared/types/result";
import { DialogService } from "@/ui/dialogs/dialog-gateway";
import { Console } from "@/ui/notifications/console-gateway";
import i18n from "@/app/providers/i18n";
import { createEntityCollectionForm } from "@/shared/constant/form/create-entity-collection.form";
import { saveCurrentWorkspace } from "@/application/actions/workspace.actions";
import { useEntityCollectionStore } from "@/ui/stores/entity-collection.store";
import { normalizeEntityCollectionData } from "@/editor/model/entity/entity.normalizer";
import { EntityCollection } from "@/editor/model/entity/entity-collection";
import { EntityDefinitionData } from "@/shared/data-types/entity.data";

const defaultEntityData: Omit<EntityDefinitionData, "id"> = {
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

export async function createEntityCollection(): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return;

        const form = await DialogService.openFormDialog(createEntityCollectionForm);
        if (!form) return;

        const entityCollectionAbsPath = await FileDialogService.saveFile({
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
        await saveCurrentWorkspace({ waitForTimeout: false });

        await selectEntityCollection(entityCollectionData.id);

        Console.success({ message: "message.entityCollection.createSuccess" });
    }

export async function selectEntityCollection(entityCollectionId: string | null): Promise<void> {
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

        await saveCurrentWorkspace({ waitForTimeout: false });
    }

export async function selectEntity(entityId: string | null): Promise<void> {
        const currentWorkspace = appKernel.editorFacade.currentWorkspace;
        if (!currentWorkspace) return;

        useEntityCollectionStore.getState().setSelectedEntityId(entityId);
        currentWorkspace.entityCollectionSessionManager.setSelectedEntityId(entityId);

        await saveCurrentWorkspace({ waitForTimeout: false });
    }

export async function deleteEntityCollection(entityCollectionId: string): Promise<void> {
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
            await selectEntityCollection(null);
        }

        await editorFacade.projectManager.saveCurrrentProject();
        await saveCurrentWorkspace({ waitForTimeout: false });
    }

export async function createEntity(): Promise<void> {
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

        const entityCollection = await loadEntityCollection(entityCollectionId);
        if (!entityCollection) {
            Console.error({ message: "message.entityCollection.entityCreateFail" });
            return;
        }

        const entity = entityCollection.addEntityDefinition(defaultEntityData);

        currentProject.entityCollectionManager.notifyEntityCollectionUpdated(entityCollectionId);

        await selectEntity(entity.id);

        const saved = await saveEntityCollectionChanges(entityCollectionId);
        if (!saved) return;

        Console.success({
            message: {
                key: "message.entityCollection.entityCreateSuccess",
                options: { name: entity.name },
            },
        });

        await DialogService.openEditEntityDefinitionDialog(entityCollectionId, entity.id);
    }

export async function editEntity(entityCollectionId?: string, entityId?: string): Promise<void> {
        const resolvedIds = resolveEntityIds(entityCollectionId, entityId);
        if (!resolvedIds) {
            Console.error({ message: "message.entityCollection.entityEditFail" });
            return;
        }

        const entityCollection = await loadEntityCollection(resolvedIds.entityCollectionId);
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

export async function deleteEntity(entityCollectionId?: string, entityId?: string): Promise<void> {
        const editorFacade = appKernel.editorFacade;
        const currentProject = editorFacade.currentProject;
        const currentWorkspace = editorFacade.currentWorkspace;

        if (!currentProject || !currentWorkspace) return;

        const resolvedIds = resolveEntityIds(entityCollectionId, entityId);
        if (!resolvedIds) {
            Console.error({ message: "message.entityCollection.entityDeleteFail" });
            return;
        }

        const entityCollection = await loadEntityCollection(resolvedIds.entityCollectionId);
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
            await selectEntity(null);
        }

        const saved = await saveEntityCollectionChanges(resolvedIds.entityCollectionId);
        if (!saved) return;

        Console.success({
            message: {
                key: "message.entityCollection.entityDeleteSuccess",
                options: { name: entity.name },
            },
        });
    }

export async function cloneEntity(entityCollectionId?: string, entityId?: string): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;

        if (!currentProject) return;

        const resolvedIds = resolveEntityIds(entityCollectionId, entityId);
        if (!resolvedIds) {
            Console.error({ message: "message.entityCollection.entityCloneFail" });
            return;
        }

        const entityCollection = await loadEntityCollection(resolvedIds.entityCollectionId);
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

        await selectEntity(clonedEntity.id);

        const saved = await saveEntityCollectionChanges(resolvedIds.entityCollectionId);
        if (!saved) return;

        Console.success({
            message: {
                key: "message.entityCollection.entityCloneSuccess",
                options: { name: clonedEntity.name },
            },
        });

        await DialogService.openEditEntityDefinitionDialog(resolvedIds.entityCollectionId, clonedEntity.id);
    }

function resolveEntityIds(entityCollectionId?: string, entityId?: string): { entityCollectionId: string; entityId: string } | null {
        const state = useEntityCollectionStore.getState();
        const resolvedEntityCollectionId = entityCollectionId ?? state.selectedEntityCollectionId;
        const resolvedEntityId = entityId ?? state.selectedEntityId;

        if (!resolvedEntityCollectionId || !resolvedEntityId) return null;

        return {
            entityCollectionId: resolvedEntityCollectionId,
            entityId: resolvedEntityId,
        };
    }

async function loadEntityCollection(entityCollectionId: string): Promise<EntityCollection | null> {
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

async function saveEntityCollectionChanges(entityCollectionId: string): Promise<boolean> {
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
        await saveCurrentWorkspace({ waitForTimeout: false });

        return true;
    }
