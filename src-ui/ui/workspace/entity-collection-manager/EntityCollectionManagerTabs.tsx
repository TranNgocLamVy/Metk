import { useRef } from "react";

import * as EntityCollectionActions from "@/application/actions/entity-collection.actions";
import { useHorizontalScroll } from "@/ui/hooks/useHorizontalSCroll.hook";
import { useEntityCollectionDisplayDatas, useSelectedEntityCollectionId } from "@/ui/stores/entity-collection.store";

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";
import { Ellipsis, Pen, Plus, Trash2 } from "lucide-react";

export default function EntityCollectionManagerTabs() {
    const ref = useRef<HTMLDivElement>(null);

    useHorizontalScroll(ref);

    const entityCollectionDisplayDatas = useEntityCollectionDisplayDatas();
    const currentSelectedEntityCollectionId = useSelectedEntityCollectionId();

    return (
        <HStack className="w-full" justify="start" align="center">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Button variant={"ghost"} size={"icon"} asChild className="p-1.5 border-(length:--panel-border-width) border-frame border-x-0">
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="min-w-60">
                    <DropdownMenuItem onClick={EntityCollectionActions.createEntityCollection}>
                        <Plus />
                        <LocalizedText message="workspace.entityCollectionManager.dropdown.new" />
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled onClick={() => { }}>
                        <Pen />
                        <LocalizedText message="workspace.entityCollectionManager.dropdown.edit" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        disabled={!currentSelectedEntityCollectionId}
                        onClick={() => {
                            if (!currentSelectedEntityCollectionId) return;
                            EntityCollectionActions.deleteEntityCollection(currentSelectedEntityCollectionId);
                        }}
                    >
                        <Trash2 className="text-destructive" />
                        <LocalizedText message="workspace.entityCollectionManager.dropdown.delete" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div ref={ref} className="flex flex-row relative items-center overflow-y-scroll scroll-smooth no-scrollbar bg-surface-sunken w-full h-8">
                <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none border-(length:--panel-border-width) border-frame" />
                {entityCollectionDisplayDatas.map((collection) => {
                    const isCurrent = currentSelectedEntityCollectionId === collection.id;

                    return (
                        <Button
                            key={collection.id}
                            variant="empty"
                            size="sm"
                            onClick={() => {
                                if (isCurrent) return;
                                EntityCollectionActions.selectEntityCollection(collection.id);
                            }}
                            className={`pr-2 h-full border-none text-foreground relative cursor-pointer ${isCurrent
                                ? "bg-surface"
                                : "bg-transparent"
                                }`}
                        >
                            {isCurrent && <div className="absolute bottom-0 top-0 left-0 right-0 border-(length:--panel-border-width) pointer-events-none border-frame" />}
                            {collection.name}
                        </Button>
                    );
                })}
            </div>
        </HStack>
    );
}
