import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { BoxCollision } from "@/editor/model/collision-object/box-collision";
import { CollisionObject } from "@/editor/model/collision-object/collision-object";
import { PointCollision } from "@/editor/model/collision-object/point-collision";
import { PolygonCollision } from "@/editor/model/collision-object/polygon-collision";
import { Tile } from "@/editor/model/tileset/tileset";
import { groupProperties } from "@/editor/properties/group-properties.utils";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { ScrollArea } from "@/ui/components/shadcn/scroll-area";

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { Button } from "@/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/ui/components/shadcn/resizable";
import { PropertyGroup } from "@/ui/workspace/properties-panel/PropertyGroup";
import { Box, Dot, LineSquiggle, Plus, Trash2 } from "lucide-react";
import { useEditTileset } from "./ContextProvider";

export function RightPanel() {
    const { selectedTile } = useEditTileset();

    return (
        <VStack className="w-1/4 h-full bg-surface-overlay p-2 shadow-sm">
            <VStack className="w-full h-full min-h-0 overflow-hidden bg-surface-base flex flex-col">
                {!selectedTile && (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        Select one tile
                    </div>
                )}

                {selectedTile && (
                    <ResizablePanelGroup orientation="vertical" className="w-full h-full">
                        <ResizablePanel defaultSize="50%">
                            <PropertyPanel selectedTile={selectedTile} />
                        </ResizablePanel>
                        <ResizableHandle className="w-full h-2 bg-foreground/20" />
                        <ResizablePanel defaultSize="50%">
                            <CollisionObjectPanel selectedTile={selectedTile} />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                )}
            </VStack>
        </VStack>
    );
}

function PropertyPanel({ selectedTile }: { selectedTile: Tile }) {

    const groups = useMemo(() => {
        return groupProperties(selectedTile.properties);
    }, [selectedTile]);

    return (
        <VStack className="w-full h-full">
            <div className="flex h-8 items-center px-1 bg-surface-overlay">
                <span className="text-xs font-medium text-foreground"><LocalizedText message={"Properties"} /></span>
            </div>
            {groups.length === 0 && (
                <div className="w-full h-full p-3 text-xs text-muted-foreground">
                    <LocalizedText message={"This tile has no registered properties."} />
                </div>
            )}
            {groups.length > 0 && (
                <ScrollArea className="w-full h-full shadow-sm bg-surface-base">
                    <VStack>
                        {groups.map((group, index) => {
                            const groupIndex = groups.slice(0, index).reduce((total, current) => total + current.properties.length, 0);
                            return <PropertyGroup key={group.name} group={group} groupIndex={groupIndex} />
                        })}
                    </VStack>
                </ScrollArea>
            )}
        </VStack>
    );
}

function CollisionObjectPanel({ selectedTile }: { selectedTile: Tile }) {
    const [collisionVersion, setCollisionVersion] = useState(0);

    useEffect(() => {
        if (!selectedTile) return;

        const handleUpdateProperty = (key: string) => {
            if (key === "collisionObjects") {
                setCollisionVersion((value) => value + 1);
            }
        };

        selectedTile.eventEmitter.on("updateProperty", handleUpdateProperty);

        return () => {
            selectedTile.eventEmitter.off("updateProperty", handleUpdateProperty);
        };
    }, [selectedTile]);

    const collisionObjects = useMemo(() => {
        void collisionVersion;
        return selectedTile?.collisionObjects ?? [];
    }, [selectedTile, collisionVersion]);

    return (
        <VStack className="w-full h-full">
            <div className="flex h-8 items-center px-1 bg-surface-overlay">
                <span className="text-xs font-medium text-foreground"><LocalizedText message={"Collision Objects"} /></span>
            </div>

            {collisionObjects.length === 0 && (
                <div className="flex h-[calc(100%-2rem)] items-center justify-center px-4 text-center text-xs text-muted-foreground">
                    This tile has no collision objects.
                </div>
            )}

            {collisionObjects.length > 0 && (
                <VStack className="w-full h-full">
                    <ScrollArea className="h-[calc(100%-2rem)] w-full">
                        <VStack>
                            {collisionObjects.map((object, index) => (
                                <CollisionObjectListItem key={object.id} object={object} index={index} />
                            ))}
                        </VStack>
                    </ScrollArea>
                </VStack>
            )}
            <ObjectCollisionMenuBar selectedTile={selectedTile} />
        </VStack>
    )
}

function CollisionObjectListItem({ object, index }: { object: CollisionObject; index: number }) {
    const { selectedCollisionObject, actions } = useEditTileset();

    const isSelected = selectedCollisionObject?.id === object.id;
    const isOdd = index % 2 === 1;

    return (
        <VStack className={`w-full p-2 border-b cursor-pointer border-foreground/20 ${isSelected ? "bg-accent/40" : isOdd ? "bg-surface-sunken/40" : "bg-surface-base"}`} onClick={() => actions.selectCollisionObject(object.id)}>
            <div className="truncate text-xs font-medium text-foreground">
                {object.name.trim()}
            </div>
        </VStack>
    );
}

function ObjectCollisionMenuBar({ selectedTile }: { selectedTile: Tile }) {
    const { selectedCollisionObject, actions } = useEditTileset();

    const addCollisionObject = (object: CollisionObject) => {
        selectedTile.setCollisionObjects([
            ...selectedTile.collisionObjects,
            object,
        ]);

        actions.selectCollisionObject(object.id);
        actions.triggerUpdate();
    };

    const deleteSelectedCollisionObject = () => {
        if (!selectedCollisionObject) return;

        selectedTile.setCollisionObjects(
            selectedTile.collisionObjects.filter(
                (object) => object.id !== selectedCollisionObject.id,
            ),
        );

        actions.selectCollisionObject(null);
        actions.triggerUpdate();
    };

    return (
        <HStack className="bg-surface-overlay w-full px-1 py-1 gap-0.5">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant={"ghost"} size={"icon-sm"} className="p-1.5">
                        <Plus />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="min-w-60">
                    <DropdownMenuItem onClick={() => addCollisionObject(createBoxCollision(selectedTile))}>
                        <Box className="text-emerald-500" />
                        <LocalizedText message="New Box Collision" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addCollisionObject(createPointCollision(selectedTile))}>
                        <Dot className="text-yellow-300" />
                        <LocalizedText message="New Point Collision" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addCollisionObject(createPolygonCollision(selectedTile))}>
                        <LineSquiggle className="text-fuchsia-500" />
                        <LocalizedText message="New Polygon Collision" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant={"ghost"} size={"icon-sm"} disabled={!selectedCollisionObject} className="text-destructive" onClick={deleteSelectedCollisionObject}>
                <Trash2 />
            </Button>
        </HStack>
    )
}

function createBoxCollision(tile: Tile): BoxCollision {
    const tileSize = getTileSize(tile);
    const width = Math.max(1, Math.round(tileSize.width / 2));
    const height = Math.max(1, Math.round(tileSize.height / 2));

    return new BoxCollision({
        id: uuidv4(),
        kind: "box",
        name: "Box Collision",
        x: Math.round((tileSize.width - width) / 2),
        y: Math.round((tileSize.height - height) / 2),
        width,
        height,
        visible: true,
        locked: false,
    });
}

function createPointCollision(tile: Tile): PointCollision {
    const tileSize = getTileSize(tile);

    return new PointCollision({
        id: uuidv4(),
        kind: "point",
        name: "Point Collision",
        x: Math.round(tileSize.width / 2),
        y: Math.round(tileSize.height / 2),
        visible: true,
        locked: false,
    });
}

function createPolygonCollision(tile: Tile): PolygonCollision {
    const tileSize = getTileSize(tile);
    const width = Math.max(3, Math.round(tileSize.width / 2));
    const height = Math.max(3, Math.round(tileSize.height / 2));

    return new PolygonCollision({
        id: uuidv4(),
        kind: "polygon",
        name: "Polygon Collision",
        x: Math.round((tileSize.width - width) / 2),
        y: Math.round((tileSize.height - height) / 2),
        points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
        ],
        visible: true,
        locked: false,
    });
}

function getTileSize(tile: Tile): { width: number; height: number } {
    return {
        width: Math.max(1, tile.imageSource?.width ?? tile.tileset.tileWidth ?? 1),
        height: Math.max(1, tile.imageSource?.height ?? tile.tileset.tileHeight ?? 1),
    };
}
