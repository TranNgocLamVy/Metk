import { RulesetService } from "@/shared/services/rulesetService";
import { Plus } from "lucide-react";

const CreateActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.rulesetManager.contextMenu.new",
		startIcon: <Plus />,
		onClick() {
			RulesetService.createRuleset();
		},
	}
];

export const RulesetManagerContextMenu: MenuItemType = {
	label: "LayerManager",
	className: "w-60",
	groups: [CreateActionGroup],
};
