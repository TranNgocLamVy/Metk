import { useCallback, useEffect, useMemo } from "react";

import { useEntityCollectionStore } from "@/ui/stores/entity-collection.store";
import { useProjectStore } from "@/ui/stores/project.store";
import { useEntityCollectionManagerEvent } from "@/ui/hooks/useEntityCollectionManagerEvent.hook";

import { HStack, VStack } from "../../custom/stack/Stack";
import { ScrollArea, ScrollBar } from "../../shadcn/scroll-area";
import EntityCollectionManagerTabs from "./EntityCollectionManagerTabs";
import EntityCollectionMenuBar from "./EntityCollectionMenuBar";

export default function EntityCollectionManager() {
    const { activeProject } = useProjectStore();

    const {
        entityCollectionDisplayDatas,
        selectedEntityCollectionId: currentSelectedEntityCollectionId,
        setEntityCollectionDisplayData,
        setSelectedEntityCollectionId,
        setSelectedEntityId,
    } = useEntityCollectionStore();

    useEffect(() => {
        if (!activeProject) return;

        setEntityCollectionDisplayData(
            activeProject.entityCollectionManager.serialize().map((collection) => ({
                id: collection.id,
                name: collection.name,
            })),
        );

        return () => {
            setEntityCollectionDisplayData([]);
            setSelectedEntityCollectionId(null);
        };
    }, [activeProject, setEntityCollectionDisplayData, setSelectedEntityCollectionId]);

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
                }
            },
            [setEntityCollectionDisplayData, setSelectedEntityCollectionId],
        ),
    );

    const activeEntityCollection = useMemo(() => {
        if (!activeProject || !currentSelectedEntityCollectionId) return null;

        return activeProject.entityCollectionManager.getEntityCollectionById(
            currentSelectedEntityCollectionId,
        );
    }, [activeProject, currentSelectedEntityCollectionId, entityCollectionDisplayDatas]);

    const entities = activeEntityCollection?.getAllEntityDefinitions() ?? [];

    return (
        <VStack className="w-full h-full relative overflow-hidden bg-surface">
            <VStack className="absolute inset w-full h-full px-1 py-2 bg-surface">
                <EntityCollectionManagerTabs />

                <ScrollArea className="flex w-full h-full no-scrollbar bg-surface-base rounded-lg shadow-sm">
                    {!activeEntityCollection ? (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No entity collection selected
                        </div>
                    ) : entities.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            This collection has no entities
                        </div>
                    ) : (
                        <div className="flex flex-col w-full min-h-full pb-10">
                            {entities.map((entity) => (
                                <HStack key={entity.id} className="flex gap-2 p-2 hover:bg-accent/50">
                                    <div
                                        className="size-6 aspect-square rounded-sm border border-border"
                                        style={{
                                            backgroundColor:
                                                entity.graphic.type === "color"
                                                    ? entity.graphic.color
                                                    : entity.color,
                                        }}
                                    />

                                    <div className="flex flex-col min-w-0">
                                        <div className="text-xs truncate">
                                            {entity.name}
                                        </div>

                                        <div className="text-[10px] text-muted-foreground truncate">
                                            {entity.width} x {entity.height}
                                        </div>
                                    </div>
                                </HStack>
                            ))}
                        </div>
                    )}

                    <ScrollBar className="w-2" />
                </ScrollArea>
            </VStack>

            <EntityCollectionMenuBar />
        </VStack>
    );
}