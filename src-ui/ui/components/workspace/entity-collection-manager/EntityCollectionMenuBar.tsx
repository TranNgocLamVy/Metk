import { Pen, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";

import { EntityCollectionService } from "@/shared/services/entity-collection.service";
import { useEntityCollectionStore } from "@/ui/stores/entity-collection.store";

import QuickToolTip from "../../custom/QuickToolTip";
import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";

export default function EntityCollectionMenuBar() {
    const { selectedEntityCollectionId: currentSelectedEntityCollectionId } = useEntityCollectionStore();

    const onEditEntity = useCallback(() => {
        if (!currentSelectedEntityCollectionId) return;

    }, [currentSelectedEntityCollectionId]);

    const onDeleteEntity = useCallback(() => {
        if (!currentSelectedEntityCollectionId) return;

    }, [currentSelectedEntityCollectionId]);

    return (
        <HStack className="bg-surface absolute bottom-1 w-full px-1 py-1 gap-0.5">
            <QuickToolTip toolTip="workspace.entityCollectionManager.menu.new">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={EntityCollectionService.createEntity}
                >
                    <Plus />
                </Button>
            </QuickToolTip>

            <QuickToolTip toolTip="workspace.entityCollectionManager.menu.edit">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onEditEntity}
                >
                    <Pen />
                </Button>
            </QuickToolTip>

            <QuickToolTip toolTip="workspace.entityCollectionManager.menu.delete">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    disabled={!currentSelectedEntityCollectionId}
                    onClick={onDeleteEntity}
                >
                    <Trash2 />
                </Button>
            </QuickToolTip>
        </HStack>
    );
}