import "@/assets/style/flexLayout/workspace.css";

import { Action, IJsonModel, ITabRenderValues, Layout, Model, TabNode } from "flexlayout-react";
import { useEffect, useRef } from "react";

import { useRelativeFlexLayout } from "@/view/hooks/useRelativeFlexLayout";
import { useLayoutStore } from "@/view/stores/layoutStore";

import { HStack, VStack } from "../custom/stack/Stack";
import ContextBar from "./ContextBar";
import TilesetView from "./tilesetView/TilesetView";
import LayerManager from "./layerManager/LayerManager";
import TilemapEditor from "./tilemapEditor/TilemapEditor";
import RulesetManager from "./rulesetManager/RulesetManager";
import { useTranslation } from "react-i18next";
import { useContextScope } from "@/view/hooks/useContextScope";
import { appCore } from "@/core/appcore";

export default function Workspace() {
	const { t: translate } = useTranslation([]);

	const { model, setModel } = useLayoutStore();
	const layoutRef = useRef<Layout | null>(null);
	
	useContextScope("inWorkspace", true);
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
			case "rulesetManager":
				return <RulesetManager />
			default:
				return <div className="w-full h-full flex items-center justify-center">{`Unknow "${node.getComponent()}" Component`}</div>;
		}
	}

	const onRenderTab = (node: TabNode, renderValues: ITabRenderValues) => {
		const component = node.getComponent();
		switch (component) {
			case "tilesetView":
				renderValues.content = translate("workspace.tilesetSelector.label");
				break;
			case "layerManager":
				renderValues.content = translate("workspace.layerManager.label");
				break;
			case "tilemapEditor":
				renderValues.content = translate("workspace.tilemapEditor.label");
				break;
			case "rulesetManager":
				renderValues.content = translate("workspace.rulesetManager.label");
				break;
			case "properties":
				renderValues.content = translate("workspace.properties.label");
				break;
			default:
				renderValues.content = "Unknow";
				break;
		}
	}

	const onModelChange = (model: Model, action: Action) => {
		appCore.layoutManager.updateLayout(model.toJson());
	};

	return (
		<HStack className="w-full h-full">
			<VStack className="w-full h-full bg-surface">
				<VStack className="workspace w-full h-full px-1 relative">
					<Layout ref={layoutRef} model={model} factory={factory} onRenderTab={onRenderTab} onModelChange={onModelChange} />
					<div className="top-0 left-0 w-full h-full absolute pointer-events-none" />
				</VStack>
				<ContextBar />
			</VStack>
		</HStack>
	);
}
