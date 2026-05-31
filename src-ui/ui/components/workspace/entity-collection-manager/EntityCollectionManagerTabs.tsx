import { useRef } from "react";

import { EntityCollectionService } from "@/shared/services/entity-collection.service";
import { useHorizontalScroll } from "@/ui/hooks/useHorizontalSCroll.hook";
import { useEntityCollectionStore } from "@/ui/stores/entity-collection.store";

import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { Ellipsis, Pen, Plus, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import { LocalizedText } from "../../custom/LocalizeText";

export default function EntityCollectionManagerTabs() {
    const ref = useRef<HTMLDivElement>(null);

    useHorizontalScroll(ref);

    const { entityCollectionDisplayDatas, selectedEntityCollectionId: currentSelectedEntityCollectionId } = useEntityCollectionStore();

    return (
        <HStack className="w-full pb-2" justify="start" align="center">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant={"ghost"} size={"icon"} asChild className="p-1.5">
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" className="min-w-60">
                    <DropdownMenuItem onClick={EntityCollectionService.createEntityCollection}>
                        <Plus />
                        <LocalizedText message="workspace.entityCollectionManager.dropdown.new" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { }}>
                        <Pen />
                        <LocalizedText message="workspace.entityCollectionManager.dropdown.edit" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { }}>
                        <Trash2 className="text-destructive" />
                        <LocalizedText message="workspace.entityCollectionManager.dropdown.delete" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div ref={ref} className="flex flex-row items-center overflow-y-scroll scroll-smooth no-scrollbar bg-surface-sunken w-full h-8">
                {entityCollectionDisplayDatas.map((collection) => {
                    const isCurrent = currentSelectedEntityCollectionId === collection.id;

                    return (
                        <Button
                            key={collection.id}
                            variant="empty"
                            size="sm"
                            onClick={() => {
                                if (isCurrent) return;
                                EntityCollectionService.selectEntityCollection(collection.id);
                            }}
                            className={`pr-2 h-full border-none ${isCurrent
                                ? "text-foreground bg-surface tab relative"
                                : "text-muted-foreground hover:text-foreground bg-transparent"
                                }`}
                        >
                            <style>
                                {`.tab::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background-color: var(--foreground); }`}
                            </style>

                            {collection.name}
                        </Button>
                    );
                })}
            </div>
        </HStack>
    );
}