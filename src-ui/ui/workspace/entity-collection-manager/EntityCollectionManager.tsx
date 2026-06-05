import { useCallback, useEffect, useMemo, useState } from "react";

import * as EntityCollectionActions from "@/application/actions/entity-collection.actions";
import { useEntityCollectionManagerEvent } from "@/ui/hooks/useEntityCollectionManagerEvent.hook";
import { useEntityCollectionStore } from "@/ui/stores/entity-collection.store";
import { useProjectStore } from "@/ui/stores/project.store";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import PixiImage from "@/ui/components/custom/PixiImage";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import PanelContainer from "@/ui/components/layout/PanelContainer";
import { ScrollArea, ScrollBar } from "@/ui/components/shadcn/scroll-area";
import EntityCollectionManagerTabs from "./EntityCollectionManagerTabs";
import EntityCollectionMenuBar from "./EntityCollectionMenuBar";

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
        EntityCollectionActions.selectEntity(entityId);
    }, []);

    const onEditEntity = useCallback((entityId: string) => {
        if (!currentSelectedEntityCollectionId) return;
        EntityCollectionActions.editEntity(currentSelectedEntityCollectionId, entityId);
    }, [currentSelectedEntityCollectionId]);

    return (
        <PanelContainer className="entity-collection-manager">
            <VStack className="w-full h-full px-frame-quarter pb-frame-half pt-1 bg-surface">
                <EntityCollectionMenuBar />
                <ScrollArea className="flex flex-1 no-scrollbar bg-surface-base rounded-md inset-shadow-panel border-t-(length:--panel-border-width) border-frame">
                    {!activeEntityCollection ? (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            <LocalizedText message="workspace.entityCollectionManager.empty" />
                        </div>
                    ) : entities.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            <LocalizedText message="workspace.entityCollectionManager.noEntities" />
                        </div>
                    ) : (
                        <div className="flex flex-col w-full min-h-full">
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

                <EntityCollectionManagerTabs />
            </VStack>
        </PanelContainer>
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
            <div className="size-8 aspect-square bg-surface relative flex items-center justify-center cursor-not-allowed">
                <PixiImage texture={tileTexture} />
            </div>
        );
    }
    return null;
}