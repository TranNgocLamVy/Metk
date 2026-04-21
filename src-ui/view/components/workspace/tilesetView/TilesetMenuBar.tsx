import { Pen, Plus, Trash2 } from "lucide-react";
import { HStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import QuickToolTip from "../../custom/QuickToolTip";
import { TilesetService } from "@/shared/services/tilesetService";
import { useTranslation } from "react-i18next";

export default function TilesetMenuBar() {
    const { t: translate } = useTranslation([]);

    return (
        <HStack className="bg-surface w-full gap-0.5 pt-1">
            <QuickToolTip toolTip={translate("workspace.tilesetSelector.menu.new")}>
                <Button variant={"ghost"} size={"icon-sm"} onClick={TilesetService.createTileset}>
                    <Plus />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={translate("workspace.tilesetSelector.menu.edit")}>
                <Button variant={"ghost"} size={"icon-sm"} disabled>
                    <Pen />
                </Button>
            </QuickToolTip>
            <QuickToolTip toolTip={translate("workspace.tilesetSelector.menu.delete")}>
                <Button variant={"ghost"} size={"icon-sm"} className="text-destructive" disabled>
                    <Trash2 />
                </Button>
            </QuickToolTip>
        </HStack>
    )
}