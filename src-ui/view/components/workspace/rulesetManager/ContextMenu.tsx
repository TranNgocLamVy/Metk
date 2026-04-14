import { RulesetService } from "@/shared/services/rulesetService";
import { Plus } from "lucide-react";

const CreateActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Create Ruleset",
		startIcon: <Plus />,
		onClick() {
			RulesetService.createRuleset();
		},
	}
];

export const RulesetManagerContextMenu: MenuItemType = {
	name: "LayerManager",
	className: "w-60 bg-secondary-background",
	groups: [CreateActionGroup],
};
