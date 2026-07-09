import { Copy, Pen, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

import * as EntityCollectionActions from "@/application/actions/entity-collection.actions";
import { useSelectedEntityCollectionId, useSelectedEntityId } from "@/ui/stores/entity-collection.store";

import QuickToolTip from "@/ui/components/custom/QuickToolTip";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";

export default function EntityCollectionMenuBar() {
    const currentSelectedEntityCollectionId = useSelectedEntityCollectionId();
    const selectedEntityId = useSelectedEntityId();

    const onEditEntity = useCallback(() => {
        if (!currentSelectedEntityCollectionId || !selectedEntityId) return;
        EntityCollectionActions.editEntity(currentSelectedEntityCollectionId, selectedEntityId);
    }, [currentSelectedEntityCollectionId, selectedEntityId]);

    const onDeleteEntity = useCallback(() => {
        if (!currentSelectedEntityCollectionId || !selectedEntityId) return;
        EntityCollectionActions.deleteEntity(currentSelectedEntityCollectionId, selectedEntityId);
    }, [currentSelectedEntityCollectionId, selectedEntityId]);

    const onCloneEntity = useCallback(() => {
        if (!currentSelectedEntityCollectionId || !selectedEntityId) return;
        EntityCollectionActions.cloneEntity(currentSelectedEntityCollectionId, selectedEntityId);
    }, [currentSelectedEntityCollectionId, selectedEntityId]);

    return (
        <HStack className="bg-surface w-full p-1 pt-0 gap-0.5">
            <QuickToolTip toolTip="workspace.entityCollectionManager.menu.new">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!currentSelectedEntityCollectionId}
                    onClick={EntityCollectionActions.createEntity}
                >
                    <Plus />
                </Button>
            </QuickToolTip>

            <QuickToolTip toolTip="workspace.entityCollectionManager.menu.edit">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!selectedEntityId}
                    onClick={onEditEntity}
                >
                    <Pen />
                </Button>
            </QuickToolTip>

            <QuickToolTip toolTip="workspace.entityCollectionManager.menu.clone">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!selectedEntityId}
                    onClick={onCloneEntity}
                >
                    <Copy />
                </Button>
            </QuickToolTip>

            <QuickToolTip toolTip="workspace.entityCollectionManager.menu.delete">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    disabled={!selectedEntityId}
                    onClick={onDeleteEntity}
                >
                    <Trash2 />
                </Button>
            </QuickToolTip>
        </HStack>
    );
}
