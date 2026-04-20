import { ArrowBigDown, ArrowBigUp, Copy, Eye, Folder, Grid3x3, Lock, Plus, Trash2 } from "lucide-react";
import { HStack, VStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import QuickToolTip from "../../custom/QuickToolTip";
import { useLayerManagerStore } from "@/view/stores/layerManagerStore";
import { useMemo } from "react";
import { Separator } from "../../shadcn/separator";
import { TilemapLayerService } from "@/shared/services/tilemapLayerService";

export default function LayerMenuBar() {
    const { selectedIds, version, getFlatView } = useLayerManagerStore();

    const nonSelectedIds = useMemo(() => {
        const allLayer = getFlatView().map(layer => layer.id);
        return allLayer.filter(id => !selectedIds.includes(id));
    }, [selectedIds, version]);

    const hasSelectedLayer = useMemo(() => {
        return selectedIds.length > 0;
    }, [selectedIds, version]);

    const singleSelected = useMemo(() => {
        return selectedIds.length === 1;
    }, [selectedIds, version]);

    return (
        <HStack className="bg-surface absolute bottom-1 w-full px-1 py-1 gap-0.5">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <QuickToolTip toolTip="Create Layer">
                        <Button variant={"ghost"} size={"icon-sm"} asChild className="p-1.5">
                            <Plus />
                        </Button>
                    </QuickToolTip>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top">
                    <DropdownMenuItem onClick={TilemapLayerService.createNewTileLayer}>
                        <Grid3x3 className="text-emerald-500" />
                        Tile Layer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerService.createNewRuleLayer}>
                        <Grid3x3 className="text-yellow-300" />
                        Rule Layer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerService.createNewGroupLayer}>
                        <Folder className="text-blue-500" />
                        Group Layer
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <QuickToolTip toolTip="Raise Layer">
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer || !singleSelected} onClick={TilemapLayerService.moveLayersUp}>
                    <ArrowBigUp />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip="Lower Layer">
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer || !singleSelected} onClick={TilemapLayerService.moveLayersDown}>
                    <ArrowBigDown />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip="Duplicate Layer">
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={TilemapLayerService.duplicateLayer}>
                    <Copy />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip="Delete Layers">
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} className="text-destructive" onClick={TilemapLayerService.deleteLayer}>
                    <Trash2 />
                </Button>
            </QuickToolTip>
            <VStack justify="center">
                <Separator orientation="vertical" className="bg-foreground/20 h-4" />
            </VStack>
            <QuickToolTip toolTip="Show/Hide selected Layers">
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={() => TilemapLayerService.toggleVisibility(selectedIds)}>
                    <Eye />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip="Lock/Unlock selected Layers">
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={() => TilemapLayerService.toggleLock(selectedIds)}>
                    <Lock />
                </Button>
            </QuickToolTip>
            <VStack className="ml-auto" />
            <QuickToolTip toolTip="Show/Hide other Layers">
                <Button variant={"ghost"} size={"icon-sm"} onClick={() => TilemapLayerService.toggleVisibility(nonSelectedIds)}>
                    <Eye />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip="Lock/Unlock other Layers">
                <Button variant={"ghost"} size={"icon-sm"} onClick={() => TilemapLayerService.toggleLock(nonSelectedIds)}>
                    <Lock />
                </Button>
            </QuickToolTip>
        </HStack>
    )
}