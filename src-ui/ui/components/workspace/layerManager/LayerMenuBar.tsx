import { ArrowBigDown, ArrowBigUp, Copy, Eye, Folder, Grid3x3, Image, Lock, Plus, Trash2 } from "lucide-react";
import { HStack, VStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import QuickToolTip from "../../custom/QuickToolTip";
import { useLayerManagerStore } from "@/ui/stores/layer-manager.store";
import { useMemo } from "react";
import { Separator } from "../../shadcn/separator";
import { TilemapLayerService } from "@/shared/services/tilemap-layer.service";
import { LocalizedText } from "../../custom/LocalizeText";
export default function LayerMenuBar() {
    const { layerViews, selectedLayers } = useLayerManagerStore();

    const { nonSelectedLayers, hasSelectedLayer, singleSelected } = useMemo(() => {
        const nonSelectedLayers = layerViews.filter(layer => !selectedLayers.includes(layer.id)).map(layer => layer.id);
        const hasSelectedLayer = selectedLayers.length > 0;
        const singleSelected = selectedLayers.length === 1;
        return { selectedLayers, nonSelectedLayers, hasSelectedLayer, singleSelected };
    }, [layerViews, selectedLayers])

    return (
        <HStack className="bg-surface absolute bottom-1 w-full px-1 py-1 gap-0.5">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <QuickToolTip toolTip={"workspace.layerManager.menu.new.label"}>
                        <Button variant={"ghost"} size={"icon-sm"} asChild className="p-1.5">
                            <Plus />
                        </Button>
                    </QuickToolTip>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top">
                    <DropdownMenuItem onClick={TilemapLayerService.createNewTileLayer}>
                        <Grid3x3 className="text-emerald-500" />
                        <LocalizedText message="workspace.layerManager.menu.new.tileLayer" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerService.createNewRuleLayer}>
                        <Grid3x3 className="text-yellow-300" />
                        <LocalizedText message="workspace.layerManager.menu.new.ruleLayer" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerService.createNewImageLayer}>
                        <Image className="text-fuchsia-500" />
                        <LocalizedText message="workspace.layerManager.menu.new.imageLayer" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerService.createNewGroupLayer}>
                        <Folder className="text-blue-500" />
                        <LocalizedText message="workspace.layerManager.menu.new.groupLayer" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <QuickToolTip toolTip={"workspace.layerManager.menu.raiseLayer"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer || !singleSelected} onClick={TilemapLayerService.moveLayersUp}>
                    <ArrowBigUp />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.layerManager.menu.lowerLayer"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer || !singleSelected} onClick={TilemapLayerService.moveLayersDown}>
                    <ArrowBigDown />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.layerManager.menu.duplicate"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={TilemapLayerService.duplicateLayer}>
                    <Copy />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.layerManager.menu.delete"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} className="text-destructive" onClick={TilemapLayerService.deleteLayer}>
                    <Trash2 />
                </Button>
            </QuickToolTip>
            <VStack justify="center">
                <Separator orientation="vertical" className="bg-foreground/20 h-4" />
            </VStack>
            <QuickToolTip toolTip={"workspace.layerManager.menu.showHideSelected"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={() => TilemapLayerService.toggleVisibility(selectedLayers)}>
                    <Eye />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.layerManager.menu.lockUnlockSelected"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={() => TilemapLayerService.toggleLock(selectedLayers)}>
                    <Lock />
                </Button>
            </QuickToolTip>
        </HStack>
    )
}