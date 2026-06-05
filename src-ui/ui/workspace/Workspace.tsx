import "@/assets/style/flexLayout/workspace.css";

import { Action, ITabRenderValues, Layout, Model, TabNode } from "flexlayout-react";
import { useCallback, useEffect, useRef } from "react";

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { useRelativeFlexLayout } from "@/ui/hooks/useRelativeFlexLayout.hook";
import { useLayoutStore } from "@/ui/stores/layout.store";

import { appKernel } from "@/application/bootstrap/app-kernel";
import EntityCollectionManager from "./entity-collection-manager/EntityCollectionManager";
import LayerManager from "./layer-manager/LayerManager";
import PropertyPanel from "./properties-panel/PropertyPanel";
import RulesetManager from "./ruleset-manager/RulesetManager";
import TilemapEditor from "./tilemap-editor/TilemapEditor";
import TilesetViewSelector from "./tileset-view/TilesetViewSelector";
import { addWorkspacePanelToModel, removeWorkspacePanelFromModel, syncWorkspaceLayoutSettingsFromModel, WORKSPACE_LAYOUT_PANELS } from "./workspace-layout-panel.utils";

const settings = appKernel.settings;

export default function Workspace() {
	const { model } = useLayoutStore();

	const layoutRef = useRef<Layout | null>(null);
	const modelRef = useRef(model);
	const isSyncingSettingsFromLayoutRef = useRef(false);

	useRelativeFlexLayout(layoutRef);

	const syncSettingsFromLayout = useCallback((layoutModel: Model) => {
		isSyncingSettingsFromLayoutRef.current = true;

		void syncWorkspaceLayoutSettingsFromModel(layoutModel).finally(() => {
			isSyncingSettingsFromLayoutRef.current = false;
		});
	}, []);

	useEffect(() => {
		modelRef.current = model;
		syncSettingsFromLayout(model);
	}, [model, syncSettingsFromLayout]);

	useEffect(() => {
		const disposers = WORKSPACE_LAYOUT_PANELS.map((panel) => {
			return settings.onDidChangeSetting(panel.settingKey, (event) => {
				if (isSyncingSettingsFromLayoutRef.current) return;

				const layoutModel = modelRef.current;
				const shouldShowPanel = event.newValue === true;

				if (shouldShowPanel) {
					addWorkspacePanelToModel(layoutModel, panel.id);
				} else {
					removeWorkspacePanelFromModel(layoutModel, panel.id);
				}

				appKernel.layoutManager.updateLayout(layoutModel.toJson());
				layoutRef.current?.redraw();
			});
		});

		return () => {
			disposers.forEach((dispose) => dispose());
		};
	}, []);

	const factory = (node: TabNode) => {
		const component = node.getComponent();

		switch (component) {
			case "tilesetView":
				return <TilesetViewSelector />;
			case "layerManager":
				return <LayerManager />;
			case "tilemapEditor":
				return <TilemapEditor />;
			case "rulesetManager":
				return <RulesetManager />;
			case "properties":
				return <PropertyPanel />;
			case "entityCollectionManager":
				return <EntityCollectionManager />;
			default:
				return (
					<div className="w-full h-full flex items-center justify-center">
						{`Unknow "${node.getComponent()}" Component`}
					</div>
				);
		}
	};

	const onRenderTab = (node: TabNode, renderValues: ITabRenderValues) => {
		const component = node.getComponent();
		switch (component) {
			case "tilesetView":
				renderValues.content = <LocalizedText message="workspace.tilesetSelector.label" />;
				break;
			case "layerManager":
				renderValues.content = <LocalizedText message="workspace.layerManager.label" />;
				break;
			case "tilemapEditor":
				renderValues.content = <LocalizedText message="workspace.tilemapEditor.label" />;
				break;
			case "rulesetManager":
				renderValues.content = <LocalizedText message="workspace.rulesetManager.label" />;
				break;
			case "properties":
				renderValues.content = <LocalizedText message="workspace.properties.label" />;
				break;
			case "entityCollectionManager":
				renderValues.content = <LocalizedText message="workspace.entityCollectionManager.label" />;
				break;
			default:
				renderValues.content = "Unknow";
				break;
		}
	};

	const onModelChange = (changedModel: Model, _action: Action) => {
		appKernel.layoutManager.updateLayout(changedModel.toJson());
		syncSettingsFromLayout(changedModel);
	};

	return (
		<HStack className="w-full h-full select-none">
			<VStack className="w-full h-full bg-surface">
				<VStack className="workspace w-full h-full px-frame-quarter pt-frame-half relative">
					<Layout
						ref={layoutRef}
						model={model}
						factory={factory}
						onRenderTab={onRenderTab}
						onModelChange={onModelChange}
					/>
					<div className="top-0 left-0 w-full h-full absolute pointer-events-none" />
				</VStack>
			</VStack>
		</HStack>
	);
}