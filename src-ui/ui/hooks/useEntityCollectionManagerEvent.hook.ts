import { useEffect } from "react";

import { EntityCollectionManagerEvent } from "@/application/resources/entity/entity-collection.manager";
import { useProjectStore } from "@/ui/stores/project.store";

export function useEntityCollectionManagerEvent<TEvent extends keyof EntityCollectionManagerEvent>(
    eventName: TEvent,
    callback: EntityCollectionManagerEvent[TEvent],
) {
    const currentProject = useProjectStore((state) => state.activeProject);

    useEffect(() => {
        if (!currentProject) return;

        const entityCollectionManager = currentProject.entityCollectionManager;

        entityCollectionManager.on(eventName, callback as any);

        return () => {
            entityCollectionManager.off(eventName, callback as any);
        };
    }, [currentProject, eventName, callback]);
}