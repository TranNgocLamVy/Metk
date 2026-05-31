import { useCallback, useEffect, useMemo, useState } from "react";

import { EntityCollectionService } from "@/shared/services/entity-collection.service";
import { useEntityCollectionStore } from "@/ui/stores/entity-collection.store";
import { useProjectStore } from "@/ui/stores/project.store";
import { useEntityCollectionManagerEvent } from "@/ui/hooks/useEntityCollectionManagerEvent.hook";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";

import { HStack, VStack } from "../../custom/stack/Stack";
import { LocalizedText } from "../../custom/LocalizeText";
import { ScrollArea, ScrollBar } from "../../shadcn/scroll-area";
import EntityCollectionManagerTabs from "./EntityCollectionManagerTabs";
import EntityCollectionMenuBar from "./EntityCollectionMenuBar";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { appKernel } from "@/application/bootstrap/app-kernel";
import PixiImage from "../../custom/PixiImage";

export default function EntityCollectionManager() {
    const { activeProject } = useProjectStore();
    const { activeWorkspace } = useWorkspaceStore();
    const [entityCollectionVersion, setEntityCollectionVersion] = useState(0);

    const {
        entityCollectionDisplayDatas,
        selectedEntityCollectionId: currentSelectedEntityCollectionId,
        selectedEntityId,
        setEntityCollectionDisplayData,
        setSelectedEntityCollectionId,
        setSelectedEntityId,
    } = useEntityCollectionStore();

    useEffect(() => {
        if (!activeProject || !activeWorkspace) return;

        const entityCollections = activeProject.entityCollectionManager.serialize();

        setEntityCollectionDisplayData(
            entityCollections.map((collection) => ({
                id: collection.id,
                name: collection.name,
            })),
        );

        const selectedEntityCollectionId =
            activeWorkspace.entityCollectionSessionManager.getSelectedEntityCollectionId();

        if (
            selectedEntityCollectionId &&
            entityCollections.some((collection) => collection.id === selectedEntityCollectionId)
        ) {
            setSelectedEntityCollectionId(selectedEntityCollectionId);
            setSelectedEntityId(activeWorkspace.entityCollectionSessionManager.getSelectedEntityId());
        } else {
            setSelectedEntityCollectionId(null);
            setSelectedEntityId(null);
        }

        return () => {
            setEntityCollectionDisplayData([]);
            setSelectedEntityCollectionId(null);
            setSelectedEntityId(null);
        };
    }, [activeProject, activeWorkspace, setEntityCollectionDisplayData, setSelectedEntityCollectionId, setSelectedEntityId]);

    useEntityCollectionManagerEvent(
        "onEntityCollectionManagerUpdated",
        useCallback(
            (collections) => {
                setEntityCollectionDisplayData(
                    collections.map((collection) => ({
                        id: collection.id,
                        name: collection.name,
                    })),
                );

                const currentSelectedId =
                    useEntityCollectionStore.getState().selectedEntityCollectionId;

                if (
                    currentSelectedId &&
                    !collections.some((collection) => collection.id === currentSelectedId)
                ) {
                    setSelectedEntityCollectionId(null);
                    setSelectedEntityId(null);
                }
            },
            [setEntityCollectionDisplayData, setSelectedEntityCollectionId, setSelectedEntityId],
        ),
    );

    useEntityCollectionManagerEvent(
        "onEntityCollectionUpdated",
        useCallback(
            (entityCollectionId) => {
                if (entityCollectionId !== currentSelectedEntityCollectionId) return;
                setEntityCollectionVersion((version) => version + 1);
            },
            [currentSelectedEntityCollectionId],
        ),
    );

    const activeEntityCollection = useMemo(() => {
        if (!activeProject || !currentSelectedEntityCollectionId) return null;

        return activeProject.entityCollectionManager.getEntityCollectionById(
            currentSelectedEntityCollectionId,
        );
    }, [activeProject, currentSelectedEntityCollectionId, entityCollectionDisplayDatas, entityCollectionVersion]);

    const entities = activeEntityCollection?.getAllEntityDefinitions() ?? [];

    const onSelectEntity = useCallback((entityId: string) => {
        EntityCollectionService.selectEntity(entityId);
    }, []);

    const onEditEntity = useCallback((entityId: string) => {
        if (!currentSelectedEntityCollectionId) return;
        EntityCollectionService.editEntity(currentSelectedEntityCollectionId, entityId);
    }, [currentSelectedEntityCollectionId]);

    return (
        <VStack className="w-full h-full relative overflow-hidden bg-surface">
            <VStack className="absolute inset w-full h-full px-1 py-2 bg-surface">
                <EntityCollectionManagerTabs />

                <ScrollArea className="flex w-full h-full no-scrollbar bg-surface-base rounded-lg shadow-sm">
                    {!activeEntityCollection ? (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            <LocalizedText message="workspace.entityCollectionManager.empty" />
                        </div>
                    ) : entities.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            <LocalizedText message="workspace.entityCollectionManager.noEntities" />
                        </div>
                    ) : (
                        <div className="flex flex-col w-full min-h-full pb-10">
                            {entities.map((entity) => {
                                const isSelected = selectedEntityId === entity.id;

                                return (
                                    <HStack
                                        key={entity.id}
                                        onClick={() => onSelectEntity(entity.id)}
                                        onDoubleClick={() => onEditEntity(entity.id)}
                                        className={`flex gap-2 p-2 cursor-pointer ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                                    >
                                        <EntityDefinitionGraphic entityDefinition={entity} />
                                        <div className="flex flex-col min-w-0">
                                            <div className="text-xs truncate">
                                                {entity.name}
                                            </div>

                                            <div className={`text-[10px] truncate ${isSelected ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                                                {entity.width} x {entity.height}
                                            </div>
                                        </div>
                                    </HStack>
                                );
                            })}
                        </div>
                    )}

                    <ScrollBar className="w-2" />
                </ScrollArea>
            </VStack>

            <EntityCollectionMenuBar />
        </VStack>
    );
}


export function EntityDefinitionGraphic({ entityDefinition }: { entityDefinition: EntityDefinition }) {
    if (entityDefinition.graphic.type === "color") {
        return (
            <div
                className="size-8 aspect-square rounded-sm border border-border"
                style={{
                    backgroundColor:
                        entityDefinition.graphic.type === "color"
                            ? entityDefinition.graphic.color
                            : entityDefinition.color,
                }}
            />
        )
    } else if (entityDefinition.graphic.type === "tile") {
        const tileTexture = appKernel.textureManager.getTileTexture(entityDefinition.graphic.tilesetId, entityDefinition.graphic.tileId);
        return (
            <div className="size-8 aspect-square bg-surface-overlay relative flex items-center justify-center cursor-not-allowed">
                <PixiImage texture={tileTexture} />
            </div>
        );
    }
    return null;
}