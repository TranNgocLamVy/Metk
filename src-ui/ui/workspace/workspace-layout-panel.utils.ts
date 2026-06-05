import { appKernel } from "@/application/bootstrap/app-kernel";
import { buildPanelRegistry } from "@/application/layout/layout-persistence";
import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";
import { Actions, DockLocation, IJsonTabNode, Model, TabNode } from "flexlayout-react";

export type WorkspacePanelId =
	| "tilesetView"
	| "rulesetManager"
	| "entityCollectionManager"
	| "layerManager"
	| "properties";

export type WorkspaceLayoutSettingKey =
	| "general.layout.tilesets"
	| "general.layout.rulesets"
	| "general.layout.entities"
	| "general.layout.layers"
	| "general.layout.properties";

export type WorkspacePanelDefinition = {
	id: WorkspacePanelId;
	settingKey: WorkspaceLayoutSettingKey;
};

const MAIN_EDITOR_TABSET_ID = "mainEditorTabset";

const LEFT_PRIMARY_PANEL_IDS: readonly WorkspacePanelId[] = [
	"tilesetView",
	"rulesetManager",
	"entityCollectionManager",
];

export const WORKSPACE_LAYOUT_PANELS = [
	{
		id: "tilesetView",
		settingKey: "general.layout.tilesets",
	},
	{
		id: "rulesetManager",
		settingKey: "general.layout.rulesets",
	},
	{
		id: "entityCollectionManager",
		settingKey: "general.layout.entities",
	},
	{
		id: "layerManager",
		settingKey: "general.layout.layers",
	},
	{
		id: "properties",
		settingKey: "general.layout.properties",
	},
] as const satisfies readonly WorkspacePanelDefinition[];

const workspacePanelRegistry = buildPanelRegistry(workspaceLayout);
const settings = appKernel.settings;

function cloneLayoutValue<T>(value: T): T {
	if (typeof structuredClone === "function") {
		return structuredClone(value);
	}

	return JSON.parse(JSON.stringify(value)) as T;
}

function getPanelTabJson(panelId: WorkspacePanelId): IJsonTabNode | null {
	const panelJson = workspacePanelRegistry.get(panelId);
	if (!panelJson) return null;

	return cloneLayoutValue(panelJson);
}

export function isWorkspacePanelVisible(model: Model, panelId: WorkspacePanelId): boolean {
	return !!model.getNodeById(panelId);
}

function getParentTabSetId(model: Model, panelId: WorkspacePanelId): string | null {
	const node = model.getNodeById(panelId);
	if (!(node instanceof TabNode)) return null;

	const parent = node.getParent();
	return parent?.getId() ?? null;
}

function getFirstVisiblePanelParentTabSetId(model: Model, panelIds: readonly WorkspacePanelId[]): string | null {
	for (const panelId of panelIds) {
		const parentId = getParentTabSetId(model, panelId);
		if (parentId) return parentId;
	}
	return null;
}

export function addWorkspacePanelToModel(model: Model, panelId: WorkspacePanelId): void {
	if (isWorkspacePanelVisible(model, panelId)) return;

	const panelJson = getPanelTabJson(panelId);
	if (!panelJson) return;

	const mainEditorTabSet = model.getNodeById(MAIN_EDITOR_TABSET_ID);
	if (!mainEditorTabSet) return;

	const leftPrimaryParentId = getFirstVisiblePanelParentTabSetId(model, LEFT_PRIMARY_PANEL_IDS);
	const layerParentId = getParentTabSetId(model, "layerManager");

	if (LEFT_PRIMARY_PANEL_IDS.includes(panelId)) {
		if (leftPrimaryParentId) {
			model.doAction(Actions.addNode(panelJson, leftPrimaryParentId, DockLocation.CENTER, -1, false));
			return;
		}

		if (layerParentId) {
			model.doAction(Actions.addNode(panelJson, layerParentId, DockLocation.TOP, -1, false));
			return;
		}

		model.doAction(Actions.addNode(panelJson, MAIN_EDITOR_TABSET_ID, DockLocation.LEFT, -1, false));
		return;
	}

	if (panelId === "layerManager") {
		if (leftPrimaryParentId) {
			model.doAction(Actions.addNode(panelJson, leftPrimaryParentId, DockLocation.BOTTOM, -1, false));
			return;
		}

		model.doAction(Actions.addNode(panelJson, MAIN_EDITOR_TABSET_ID, DockLocation.LEFT, -1, false));
		return;
	}

	if (panelId === "properties") {
		model.doAction(Actions.addNode(panelJson, MAIN_EDITOR_TABSET_ID, DockLocation.RIGHT, -1, false));
	}
}

export function removeWorkspacePanelFromModel(model: Model, panelId: WorkspacePanelId): void {
	if (!isWorkspacePanelVisible(model, panelId)) return;
	model.doAction(Actions.deleteTab(panelId));
}

export async function syncWorkspaceLayoutSettingsFromModel(model: Model): Promise<boolean> {
	const updatePromises = WORKSPACE_LAYOUT_PANELS.flatMap((panel) => {
		const isVisible = isWorkspacePanelVisible(model, panel.id);
		const currentValue = settings.get(panel.settingKey);

		if (currentValue === isVisible) return [];

		return [settings.update(panel.settingKey, isVisible)];
	});
	if (updatePromises.length === 0) return false;
	await Promise.all(updatePromises);
	return true;
}