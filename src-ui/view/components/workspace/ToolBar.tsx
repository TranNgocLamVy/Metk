import { useEffect, useMemo } from "react";
import { Fragment } from "react";

import { AppCore } from "@/core/appcore";
import { useToolbarStore } from "@/view/stores/toolbarStore";

import SVGIcon from "../custom/icons/SvgIcon";
import { VStack } from "../custom/stack/Stack";
import { Separator } from "../shadcn/separator";
import { Toggle } from "../shadcn/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "../shadcn/tooltip";

export default function ToolBar() {
	const { version, getTools, getActiceTool } = useToolbarStore();

    const tools = useMemo(() => getTools(), [version]);

    const activeTool = useMemo(() => getActiceTool(), [version]);

	const changeTool = (toolId: string) => {
		const toolManager = AppCore.getIns().toolManager;
		toolManager.startTool(toolId);
	};

	return (
		<VStack className="h-full w-8 bg-background">
			{tools.map((tool, index) => {
				return (
					<Fragment key={tool.id}>
						{index != 0 && <Separator />}
						<Tooltip delayDuration={250} disableHoverableContent>
							<TooltipTrigger asChild>
								<Toggle pressed={tool.id === activeTool} onPressedChange={() => changeTool(tool.id)} variant={"outline"} className="hover:bg-secondary-background">
									<SVGIcon svgString={tool.icon} />
								</Toggle>
							</TooltipTrigger>
							{tool.tooltip && (
								<TooltipContent side="left" className="shadow">
									{tool.tooltip}
									{tool.shortcuts && ` (${tool.shortcuts.map((s) => s.toUpperCase()).join(" or ")})`}
								</TooltipContent>
							)}
						</Tooltip>
					</Fragment>
				);
			})}
		</VStack>
	);
}
