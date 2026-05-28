import { useMemo } from "react";

import { groupProperties } from "@/editor/properties/group-properties.utils";
import { VStack } from "@/ui/components/custom/stack/Stack";
import { ScrollArea } from "@/ui/components/shadcn/scroll-area";
import { PropertyGroup } from "@/ui/components/workspace/properties-panel/PropertyGroup";

import { useEditTileset } from "./ContextProvider";

export function RightPanel() {
    const { selectedTile } = useEditTileset();

    const groups = useMemo(() => {
        if (!selectedTile) return [];
        return groupProperties(selectedTile.properties);
    }, [selectedTile]);

    return (
        <VStack className="w-1/4 h-full min-w-0 min-h-0 bg-surface-overlay p-2 shadow-sm">
            <div className="w-full h-full min-h-0 overflow-hidden bg-surface-base">
                {!selectedTile && (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        Select one tile
                    </div>
                )}

                {selectedTile && groups.length === 0 && (
                    <div className="w-full h-full p-3 text-xs text-muted-foreground">
                        This tile has no registered properties.
                    </div>
                )}

                {selectedTile && groups.length > 0 && (
                    <ScrollArea className="w-full h-full shadow-sm bg-surface-base">
                        <VStack>
                            {groups.map((group, index) => {
                                const groupIndex = groups
                                    .slice(0, index)
                                    .reduce(
                                        (total, current) => total + current.properties.length,
                                        0,
                                    );

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
                )}
            </div>
        </VStack>
    );
}
