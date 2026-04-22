import { useMemo } from "react";
import { Fragment } from "react";

import { appCore } from "@/core/appcore";
import { useToolbarStore } from "@/view/stores/toolbarStore";

import { HStack, VStack } from "../custom/stack/Stack";
import SVGIcon from "../custom/icons/SvgIcon";
import { Button } from "../shadcn/button";
import QuickToolTip from "../custom/QuickToolTip";
import { useTranslation } from "react-i18next";

export default function ToolBar() {
	const { version, getTools, getActiceTool } = useToolbarStore();


	const { t: translate } = useTranslation([]);

	const tools = useMemo(() => getTools(), [version]);

	const activeTool = useMemo(() => getActiceTool(), [version]);

	const changeTool = (toolId: string) => {
		const toolManager = appCore.toolManager;
		toolManager.startTool(toolId);
	};

	return (
		<VStack className="w-fit h-fit px-1 pb-0 pt-2 bg-surface">
			<HStack className="w-full h-8 gap-0.5">
				{tools.map((tool, index) => {
					const isActive = activeTool === tool.id;
					return (
						<Fragment key={tool.id}>
							<QuickToolTip toolTip={tool.tooltip ? translate(tool.tooltip) : ""}>
								<Button onClick={() => changeTool(tool.id)} variant={"empty"} className={`outline-1 ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}>
									<SVGIcon svgString={tool.icon} />
								</Button>
							</QuickToolTip>
						</Fragment>
					);
				})}
			</HStack>
		</VStack>
	);
}
