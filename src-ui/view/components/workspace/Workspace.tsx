import "@/assets/style/flexLayout/workspace.css";

import { ITabRenderValues, Layout, Model, TabNode } from "flexlayout-react";
import { useRef } from "react";

import { useRelativeFlexLayout } from "@/view/hooks/useRelativeFlexLayout";
import { useWorkspaceDockStore } from "@/view/stores/workspaceDockStore";

import { HStack, VStack } from "../custom/stack/Stack";
import ContextBar from "./ContextBar";
import ToolBar from "./ToolBar";
import TilesetView from "./tilesetView/TilesetView";
import LayerManager from "./layerManager/LayerManager";
import TilemapEditor from "./tilemapEditor/TilemapEditor";
import ATRulesetManager from "./atRulesetManager/AtRulesetManager";

export default function Workspace() {
	const layoutRef = useRef<Layout | null>(null);

	const { model } = useWorkspaceDockStore();

	useRelativeFlexLayout(layoutRef);

	const factory = (node: TabNode) => {
		const component = node.getComponent();
		switch (component) {
			case "tilesetView":
				return <TilesetView />;
			case "layerManager":
				return <LayerManager />;
			case "tilemapEditor":
				return <TilemapEditor />
			case "atRulesetManager":
				return <ATRulesetManager />
			default:
				return <div className="w-full h-full flex items-center justify-center">{`Unknow "${node.getComponent()}" Component`}</div>;
		}
	}

	const onRenderTab = (node: TabNode, renderValues: ITabRenderValues) => {
		
	}

	const onModelChange = (model: Model, action: any) => {
		localStorage.setItem("workspaceLayout", JSON.stringify(model.toJson()));
	};

	return (
		<HStack className="w-full h-full bg-secondary-background">
			<VStack className="w-full h-full">
				<VStack className="workspace w-full h-full p-1 relative">
					<Layout ref={layoutRef} model={model} factory={factory} onRenderTab={onRenderTab} onModelChange={onModelChange} />
					<div className="top-0 left-0 w-full h-full absolute pointer-events-none shadow-[inset_0px_0px_10px_5px_rgba(0,_0,_0,_0.1)]" />
				</VStack>
				<ContextBar />
			</VStack>
			<ToolBar />
		</HStack>
	);
}
