import * as TilemapLayerActions from "@/application/actions/tilemap-layer.actions";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import QuickToolTip from "@/ui/components/custom/QuickToolTip";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";
import { Separator } from "@/ui/components/shadcn/separator";
import { useLayerViews, useSelectedLayers } from "@/ui/stores/layer-manager.store";
import { ArrowBigDown, ArrowBigUp, Boxes, Copy, Eye, Folder, Grid3x3, Image, Lock, Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
export default function LayerMenuBar() {
    const layerViews = useLayerViews();
    const selectedLayers = useSelectedLayers();

    const { nonSelectedLayers, hasSelectedLayer, singleSelected } = useMemo(() => {
        const nonSelectedLayers = layerViews.filter(layer => !selectedLayers.includes(layer.id)).map(layer => layer.id);
        const hasSelectedLayer = selectedLayers.length > 0;
        const singleSelected = selectedLayers.length === 1;
        return { selectedLayers, nonSelectedLayers, hasSelectedLayer, singleSelected };
    }, [layerViews, selectedLayers])

    return (
        <HStack className="bg-surface w-full p-1 pt-0 gap-0.5">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <QuickToolTip toolTip={"workspace.layerManager.menu.new.label"}>
                        <Button variant={"ghost"} size={"icon-sm"} asChild className="p-1.5">
                            <Plus />
                        </Button>
                    </QuickToolTip>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top">
                    <DropdownMenuItem onClick={TilemapLayerActions.createNewTileLayer}>
                        <Grid3x3 className="text-emerald-500" />
                        <LocalizedText message="workspace.layerManager.menu.new.tileLayer" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerActions.createNewRuleLayer}>
                        <Grid3x3 className="text-yellow-300" />
                        <LocalizedText message="workspace.layerManager.menu.new.ruleLayer" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerActions.createNewImageLayer}>
                        <Image className="text-fuchsia-500" />
                        <LocalizedText message="workspace.layerManager.menu.new.imageLayer" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerActions.createNewEntityLayer}>
                        <Boxes className="text-cyan-400" />
                        <LocalizedText message="workspace.layerManager.menu.new.entityLayer" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerActions.createNewGroupLayer}>
                        <Folder className="text-blue-500" />
                        <LocalizedText message="workspace.layerManager.menu.new.groupLayer" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <QuickToolTip toolTip={"workspace.layerManager.menu.raiseLayer"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer || !singleSelected} onClick={TilemapLayerActions.moveLayersUp}>
                    <ArrowBigUp />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.layerManager.menu.lowerLayer"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer || !singleSelected} onClick={TilemapLayerActions.moveLayersDown}>
                    <ArrowBigDown />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.layerManager.menu.duplicate"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={TilemapLayerActions.duplicateLayer}>
                    <Copy />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.layerManager.menu.delete"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} className="text-destructive" onClick={TilemapLayerActions.deleteLayer}>
                    <Trash2 />
                </Button>
            </QuickToolTip>
            <VStack justify="center">
                <Separator orientation="vertical" className="bg-foreground/20 h-4" />
            </VStack>
            <QuickToolTip toolTip={"workspace.layerManager.menu.showHideSelected"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={() => TilemapLayerActions.toggleVisibility(selectedLayers)}>
                    <Eye />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={"workspace.layerManager.menu.lockUnlockSelected"}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={() => TilemapLayerActions.toggleLock(selectedLayers)}>
                    <Lock />
                </Button>
            </QuickToolTip>
        </HStack>
    )
}
