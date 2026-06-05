import { Fragment, useEffect } from "react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { ToolBarGroupDisplayData, useToolbarStore } from "@/ui/stores/toolbar.store";

import SVGIcon from "@/ui/components/custom/icons/SvgIcon";
import QuickToolTip from "@/ui/components/custom/QuickToolTip";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { Separator } from "../components/shadcn/separator";

export default function ToolBar() {
	const {
		groups,
		activeFamilyId,
		availableFamilyIds,

		setGroups,
		setActiveFamilyId,
		setAvailableFamilyIds,
	} = useToolbarStore();

	useEffect(() => {
		const toolManager = appKernel.toolManager;
		const toolGroup: ToolBarGroupDisplayData[] = [];

		const onToolChanged = (familyId: string | null) => setActiveFamilyId(familyId);
		const onToolAvailabilityChanged = (nextAvailableFamilyIds: string[]) => setAvailableFamilyIds(nextAvailableFamilyIds);

		toolManager.getToolGroups().forEach((group) => {
			const groupData: ToolBarGroupDisplayData = {
				id: group.id,
				label: group.label,
				items: group.families.map((toolFamily) => ({
					id: toolFamily.id,
					icon: toolFamily.icon,
					label: toolFamily.label,
					tooltip: toolFamily.description,
					shortcuts: toolFamily.shortcuts,
					index: toolFamily.priority ?? 1000
				}))
			};
			toolGroup.push(groupData);
		});

		setGroups(toolGroup);
		setActiveFamilyId(toolManager.getCurrentFamilyId())
		setAvailableFamilyIds(toolManager.getAvailableFamilyIds());

		toolManager.on("onToolChanged", onToolChanged);
		toolManager.on("onToolAvailabilityChanged", onToolAvailabilityChanged);

		return () => {
			toolManager.off("onToolChanged", onToolChanged);
			toolManager.off("onToolAvailabilityChanged", onToolAvailabilityChanged);
			setGroups([]);
			setAvailableFamilyIds([]);
		}
	}, [])

	const changeTool = (familyId: string) => {
		const toolManager = appKernel.toolManager;
		toolManager.startToolFamily(familyId);
	};

	return (
		<VStack className="w-fit h-fit p-1 px-1.5 bg-surface">
			<HStack className="w-full h-8 gap-1.5">
				{groups.sort((a, b) => a.items[0].index - b.items[0].index).map((group, index) => {
					return (
						<Fragment key={group.id}>
							<HStack className="gap-1">
								{group.items.map((tool, index) => {
									const isActive = activeFamilyId === tool.id;
									const isAvailable = availableFamilyIds.includes(tool.id);
									return (
										<Fragment key={tool.id}>
											<QuickToolTip toolTip={tool.tooltip ? tool.tooltip : ""}>
												<Button disabled={!isAvailable} onClick={() => changeTool(tool.id)} variant={"empty"} className={`outline-1 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"} ${isAvailable ? "" : "opacity-50"}`}>
													{tool.icon ? <SVGIcon svgString={tool.icon} /> : null}
												</Button>
											</QuickToolTip>
										</Fragment>
									);
								})}
							</HStack>
							{index < groups.length - 1 && <Separator orientation="vertical" />}
						</Fragment>
					)
				})}
			</HStack>
		</VStack>
	);
}
