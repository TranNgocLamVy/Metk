import { usePropertyStore } from "@/ui/stores/property.store";
import { VStack } from "../../custom/stack/Stack";
import { ScrollArea } from "../../shadcn/scroll-area";
import { BaseObject } from "@/editor/model/base-object";
import { groupProperties } from "@/editor/properties/group-properties.utils";
import { PropertyGroup } from "./PropertyGroup";
import { useCallback, useEffect, useState } from "react";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { useProjectStore } from "@/ui/stores/project.store";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";
import { WorkspaceService } from "@/shared/services/workspace.service";

export default function PropertyPanel() {
    const { objectId, setObjectId } = usePropertyStore();
    const { activeProject } = useProjectStore();
    const { activeWorkspace } = useWorkspaceStore();

    const [object, setObject] = useState<BaseObject<any> | null>(null);

    useEffect(() => {
        if (!activeWorkspace) return;
        const activeObjectId = activeWorkspace.propertyPanelManager.getSelectedObjectId();
        if (activeObjectId) setObjectId(activeObjectId)
    }, [activeWorkspace, setObjectId])

    useEffect(() => {
        if (!activeWorkspace) return;
        activeWorkspace.propertyPanelManager.selectObject(object?.objectId ?? null);
        WorkspaceService.saveCurrentWorkspace();
    }, [object, activeWorkspace])

    useEffect(() => {
        if (!objectId || !activeProject) return;
        const object = activeProject.objectRegistry.get(objectId) ?? null;
        setObject(object)
    }, [objectId, activeProject])

    const onObjectDeleted = useCallback((deletedObjectId: string) => {
        const objectId = usePropertyStore.getState().objectId;
        if (deletedObjectId === objectId) {
            setObject(null);
        }
    }, [])

    const onObjectAdded = useCallback((addedObjectId: string) => {
        const objectId = usePropertyStore.getState().objectId;
        if (addedObjectId === objectId) {
            const object = appKernel.editorFacade.objectRegistry?.get(objectId) ?? null;
            setObject(object)
        }
    }, [])

    useEffect(() => {
        if (!activeProject) return;
        const objectRegistry = activeProject.objectRegistry;

        objectRegistry.on("onObjectDeleted", onObjectDeleted);
        objectRegistry.on("onObjectAdded", onObjectAdded);

        return () => {
            objectRegistry.off("onObjectDeleted", onObjectDeleted);
            objectRegistry.off("onObjectAdded", onObjectAdded);
        }
    }, [activeProject])



    return (
        <VStack className="w-full h-full px-1 py-2 inset bg-surface">
            <VStack className="w-full h-full bg-surface-base min-h-0">
                {object && <PropertiesList object={object} />}
            </VStack>
        </VStack>
    )
}

type PropertiesListProps = {
    object: BaseObject;
}
function PropertiesList({ object }: PropertiesListProps) {
    const groups = groupProperties(object.properties);

    return (
        <ScrollArea className="w-full h-full shadow-sm bg-surface-base">
            <VStack>
                {groups.map((group, index) => {
                    const groupIndex = groups.slice(0, index).reduce((acc, curr) => acc + curr.properties.length, 0);
                    return <PropertyGroup key={group.name} group={group} groupIndex={groupIndex} />
                })}
            </VStack>
        </ScrollArea>
    )
}