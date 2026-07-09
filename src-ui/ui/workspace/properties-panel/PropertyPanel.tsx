import { useCallback, useEffect, useState } from "react";

import * as WorkspaceActions from "@/application/actions/workspace.actions";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { BaseObject, PropertyUpdateMeta } from "@/editor/model/base-object";
import { groupProperties } from "@/editor/properties/group-properties.utils";
import { useActiveProject } from "@/ui/stores/project.store";
import { usePropertyActions, usePropertyObjectId } from "@/ui/stores/property.store";
import { useActiveWorkspace } from "@/ui/stores/workspace.store";

import { VStack } from "@/ui/components/custom/stack/Stack";
import PanelContainer from "@/ui/components/layout/PanelContainer";
import { ScrollArea } from "@/ui/components/shadcn/scroll-area";
import { PropertyGroup } from "./PropertyGroup";

export default function PropertyPanel() {
    const objectId = usePropertyObjectId();
    const { setObjectId, refresh } = usePropertyActions();
    const activeProject = useActiveProject();
    const activeWorkspace = useActiveWorkspace();

    const [object, setObject] = useState<BaseObject<any> | null>(null);

    useEffect(() => {
        if (!activeWorkspace) return;
        const activeObjectId = activeWorkspace.propertyPanelManager.getSelectedObjectId();

        if (activeObjectId) {
            setObjectId(activeObjectId);
        }
    }, [activeWorkspace, setObjectId]);

    useEffect(() => {
        if (!activeWorkspace) return;
        activeWorkspace.propertyPanelManager.selectObject(object?.objectId ?? null);
        WorkspaceActions.saveCurrentWorkspace();
    }, [object, activeWorkspace]);

    useEffect(() => {
        if (!objectId || !activeProject) {
            setObject(null);
            return;
        }

        const object = activeProject.objectRegistry.get(objectId) ?? null;
        setObject(object);
    }, [objectId, activeProject]);

    useEffect(() => {
        if (!object) return;

        const handleUpdateProperty = (_key: string, _value: unknown, meta?: PropertyUpdateMeta) => {
            if (meta?.origin === "preview") return;

            refresh();
        };

        object.eventEmitter.on("updateProperty", handleUpdateProperty);

        return () => {
            object.eventEmitter.off("updateProperty", handleUpdateProperty);
        };
    }, [object]);

    const onObjectDeleted = useCallback((deletedObjectId: string) => {
        if (deletedObjectId === objectId) {
            setObject(null);
        }
    }, [objectId]);

    const onObjectAdded = useCallback((addedObjectId: string) => {
        if (addedObjectId === objectId) {
            const object = appKernel.editorFacade.objectRegistry?.get(objectId) ?? null;
            setObject(object);
        }
    }, [objectId]);

    useEffect(() => {
        if (!activeProject) return;
        const objectRegistry = activeProject.objectRegistry;

        objectRegistry.on("onObjectDeleted", onObjectDeleted);
        objectRegistry.on("onObjectAdded", onObjectAdded);

        return () => {
            objectRegistry.off("onObjectDeleted", onObjectDeleted);
            objectRegistry.off("onObjectAdded", onObjectAdded);
        };
    }, [activeProject, onObjectDeleted, onObjectAdded]);

    return (
        <PanelContainer className="property-panel">
            <VStack className="w-full h-full px-frame-quarter pb-frame-half pt-2">
                <VStack className="w-full h-full bg-surface-base border-(length:--panel-border-width) border-frame">
                    {object && <PropertiesList object={object} />}
                </VStack>
            </VStack>
        </PanelContainer>
    );
}

type PropertiesListProps = {
    object: BaseObject;
};

function PropertiesList({ object }: PropertiesListProps) {
    const groups = groupProperties(object.properties);

    return (
        <ScrollArea className="w-full min-h-0 h-full">
            <VStack className="pb-20">
                {groups.map((group, index) => {
                    const groupIndex = groups.slice(0, index).reduce((acc, curr) => acc + curr.properties.length, 0);

                    return (
                        <PropertyGroup
                            key={group.name}
                            group={group}
                            groupIndex={groupIndex}
                        />
                    );
                })}
            </VStack>
        </ScrollArea>
    );
}
