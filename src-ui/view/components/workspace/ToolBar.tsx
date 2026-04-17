import { useMemo } from "react";
import { Fragment } from "react";

import { AppCore } from "@/core/appcore";
import { useToolbarStore } from "@/view/stores/toolbarStore";

import { VStack } from "../custom/stack/Stack";

export default function ToolBar() {
	const { version, getTools, getActiceTool } = useToolbarStore();

    const tools = useMemo(() => getTools(), [version]);

    const activeTool = useMemo(() => getActiceTool(), [version]);

	const changeTool = (toolId: string) => {
		const toolManager = AppCore.getIns().toolManager;
		toolManager.startTool(toolId);
	};

	return (
		<VStack className="h-full w-8 bg-surface">
			{/* {tools.map((tool, index) => {
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
			})} */}
		</VStack>
	);
}
