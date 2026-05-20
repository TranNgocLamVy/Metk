import { ArrowBigLeft, ArrowBigRight, Crop, Grid2x2Plus, Map, Move, SquareArrowUpRight } from "lucide-react";

import AutoGrid from "@/ui/components/custom/icons/AutoGrid";
import { Label } from '@/ui/components/shadcn/label';
import { appKernel } from "@/application/bootstrap/app-kernel";
import { DialogZLevel } from "@/shared/types/dialog";
import { useDialogStore } from "@/ui/stores/dialog.store";

const activeTilemapSession = () => appKernel.editorFacade.getActiveTilemapSession();

const MapDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.action.resizeMap",
        startIcon: <Move />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.action.cropToSelection",
        startIcon: <Crop />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.action.autoCrop",
        startIcon: <Crop />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.action.offsetMap",
        startIcon: <SquareArrowUpRight />,
		disabled: () => true,
		onClick() {},
	},
];

const MapDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.action.selectNextTileset",
        startIcon: <ArrowBigRight />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.action.selectPreviousTileset",
        startIcon: <ArrowBigLeft />,
		disabled: () => true,
		onClick() {},
	},
];

const MapDropdownOptionGroup5: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.action.mapProperties",
		startIcon: <Map />,
		disabled: () => !activeTilemapSession(),
		onClick() {
			const session = activeTilemapSession();
			if (!session) return;
			const tilemap = session.tilemap;
			useDialogStore.getState().openDialog("FORM_DIALOG", { zLevel: DialogZLevel.Modal }, {
				resolve: () => {},
				formDialog: {
					title: "menu.map.action.mapProperties",
					okText: "global.action.ok",
					cancelText: "global.action.cancel",
					inputs: [
						{
							id: "map-name",
							name: "name",
							type: "text",
							label: "Name",
							defaultValue: tilemap.name,
						},
						{
							id: "map-width",
							name: "width",
							type: "number",
							label: "Width",
							defaultValue: tilemap.width,
						},
						{
							id: "map-height",
							name: "height",
							type: "number",
							label: "Height",
							defaultValue: tilemap.height,
						},
					],
				},
			});
		},
	},
];

export const MapDropdownOptions: MenuItemType = {
	label: "menu.map.label",
	className: "w-100",
	groups: [MapDropdownOptionGroup2, MapDropdownOptionGroup4, MapDropdownOptionGroup5],
};
