import { ATRulesetService } from "@/shared/services/atRulesetService";
import { Plus } from "lucide-react";

const CreateActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Create Ruleset",
		startIcon: <Plus />,
		onClick() {
			ATRulesetService.createATRuleset();
		},
	}
];

export const ATRulesetManagerContextMenu: MenuItemType = {
	name: "LayerManager",
	className: "w-60 bg-secondary-background",
	groups: [CreateActionGroup],
};
