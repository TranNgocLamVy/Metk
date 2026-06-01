import { Fragment, useEffect } from "react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { ToolbarItemDisplayData, useToolbarStore } from "@/ui/stores/toolbar.store";

import SVGIcon from "@/ui/components/custom/icons/SvgIcon";
import QuickToolTip from "@/ui/components/custom/QuickToolTip";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";

export default function ToolBar() {
	const { tools, activeTool, setTools, setActiveTool } = useToolbarStore();

	useEffect(() => {
		const toolManager = appKernel.toolManager;
        const toolData: ToolbarItemDisplayData[] = [];

        toolManager.getToolContexts().forEach((toolContext) => {
            if (toolContext.displayOnToolbar) {
                toolData.push({
                    id: toolContext.id,
                    icon: toolContext.displayOnToolbar.icon,
                    tooltip: toolContext.displayOnToolbar.tooltip,
                    shortcuts: toolContext.shortcuts,
                    index: toolContext.displayOnToolbar.index ?? 1000
                });
            }
        })
		setTools(toolData.sort((a, b) => a.index - b.index));
		setActiveTool(toolManager.getCurrentToolId())

		return () => {
			setTools([]);
		}
	}, [])

	const changeTool = (toolId: string) => {
		const toolManager = appKernel.toolManager;
		toolManager.startTool(toolId);
	};

	return (
		<VStack className="w-fit h-fit px-1 pb-0 pt-2 bg-surface">
			<HStack className="w-full h-8 gap-0.5">
				{tools.map((tool, index) => {
					const isActive = activeTool === tool.id;
					return (
						<Fragment key={tool.id}>
							<QuickToolTip toolTip={tool.tooltip ? tool.tooltip : ""}>
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
