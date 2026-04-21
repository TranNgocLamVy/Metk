import { ArrowBigDown, ArrowBigUp, Copy, Eye, Folder, Grid3x3, Lock, Plus, Trash2 } from "lucide-react";
import { HStack, VStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/dropdown-menu";
import QuickToolTip from "../../custom/QuickToolTip";
import { useLayerManagerStore } from "@/view/stores/layerManagerStore";
import { useMemo } from "react";
import { Separator } from "../../shadcn/separator";
import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { useTranslation } from "react-i18next";

export default function LayerMenuBar() {
    const { t: translate } = useTranslation([]);

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
                    <QuickToolTip toolTip={translate("workspace.layerManager.menu.new.label")}>
                        <Button variant={"ghost"} size={"icon-sm"} asChild className="p-1.5">
                            <Plus />
                        </Button>
                    </QuickToolTip>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top">
                    <DropdownMenuItem onClick={TilemapLayerService.createNewTileLayer}>
                        <Grid3x3 className="text-emerald-500" />
                        {translate("workspace.layerManager.menu.new.tileLayer")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerService.createNewRuleLayer}>
                        <Grid3x3 className="text-yellow-300" />
                        {translate("workspace.layerManager.menu.new.ruleLayer")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={TilemapLayerService.createNewGroupLayer}>
                        <Folder className="text-blue-500" />
                        {translate("workspace.layerManager.menu.new.groupLayer")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <QuickToolTip toolTip={translate("workspace.layerManager.menu.raiseLayer")}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer || !singleSelected} onClick={TilemapLayerService.moveLayersUp}>
                    <ArrowBigUp />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={translate("workspace.layerManager.menu.lowerLayer")}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer || !singleSelected} onClick={TilemapLayerService.moveLayersDown}>
                    <ArrowBigDown />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={translate("workspace.layerManager.menu.duplicate")}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={TilemapLayerService.duplicateLayer}>
                    <Copy />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={translate("workspace.layerManager.menu.delete")}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} className="text-destructive" onClick={TilemapLayerService.deleteLayer}>
                    <Trash2 />
                </Button>
            </QuickToolTip>
            <VStack justify="center">
                <Separator orientation="vertical" className="bg-foreground/20 h-4" />
            </VStack>
            <QuickToolTip toolTip={translate("workspace.layerManager.menu.showHideSelected")}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={() => TilemapLayerService.toggleVisibility(selectedIds)}>
                    <Eye />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={translate("workspace.layerManager.menu.lockUnlockSelected")}>
                <Button variant={"ghost"} size={"icon-sm"} disabled={!hasSelectedLayer} onClick={() => TilemapLayerService.toggleLock(selectedIds)}>
                    <Lock />
                </Button>
            </QuickToolTip>
            <VStack className="ml-auto" />
            <QuickToolTip toolTip={translate("workspace.layerManager.menu.showHideOther")}>
                <Button variant={"ghost"} size={"icon-sm"} onClick={() => TilemapLayerService.toggleVisibility(nonSelectedIds)}>
                    <Eye />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={translate("workspace.layerManager.menu.lockUnlockOther")}>
                <Button variant={"ghost"} size={"icon-sm"} onClick={() => TilemapLayerService.toggleLock(nonSelectedIds)}>
                    <Lock />
                </Button>
            </QuickToolTip>
        </HStack>
    )
}