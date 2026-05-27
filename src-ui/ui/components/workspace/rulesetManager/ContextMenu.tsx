import { appKernel } from "@/application/bootstrap/app-kernel";
import { RulesetService } from "@/shared/services/ruleset.service";
import { usePropertyStore } from "@/ui/stores/property.store";
import { Info, Plus } from "lucide-react";

const CreateActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.rulesetManager.contextMenu.new",
		startIcon: <Plus />,
		onClick() {
			RulesetService.createRuleset();
		}
	},
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.property",
		startIcon: <Info className="stroke-1" />,
		disabled: () => true,
		onClick() {
			
		}
	},
];

export const RulesetManagerContextMenu: MenuItemType = {
	label: "RulesetManager",
	className: "w-60",
	groups: [CreateActionGroup],
};
