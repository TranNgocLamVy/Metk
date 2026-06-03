import { Copy, Pen, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

import { EntityCollectionService } from "@/shared/services/entity-collection.service";
import { useEntityCollectionStore } from "@/ui/stores/entity-collection.store";

import QuickToolTip from "@/ui/components/custom/QuickToolTip";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";

export default function EntityCollectionMenuBar() {
    const {
        selectedEntityCollectionId: currentSelectedEntityCollectionId,
        selectedEntityId,
    } = useEntityCollectionStore();

    const onEditEntity = useCallback(() => {
        if (!currentSelectedEntityCollectionId || !selectedEntityId) return;
        EntityCollectionService.editEntity(currentSelectedEntityCollectionId, selectedEntityId);
    }, [currentSelectedEntityCollectionId, selectedEntityId]);

    const onDeleteEntity = useCallback(() => {
        if (!currentSelectedEntityCollectionId || !selectedEntityId) return;
        EntityCollectionService.deleteEntity(currentSelectedEntityCollectionId, selectedEntityId);
    }, [currentSelectedEntityCollectionId, selectedEntityId]);

    const onCloneEntity = useCallback(() => {
        if (!currentSelectedEntityCollectionId || !selectedEntityId) return;
        EntityCollectionService.cloneEntity(currentSelectedEntityCollectionId, selectedEntityId);
    }, [currentSelectedEntityCollectionId, selectedEntityId]);

    return (
        <HStack className="bg-surface w-full p-1 pt-0 gap-0.5">
            <QuickToolTip toolTip="workspace.entityCollectionManager.menu.new">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!currentSelectedEntityCollectionId}
                    onClick={EntityCollectionService.createEntity}
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
