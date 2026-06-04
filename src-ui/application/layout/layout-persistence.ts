import { IJsonModel, IJsonRowNode, IJsonTabNode, IJsonTabSetNode } from "flexlayout-react";

import {
    PERSISTED_LAYOUT_VERSION,
    PersistedLayoutContainerNode,
    PersistedLayoutModel,
    PersistedLayoutNode,
    PersistedLayoutTabNode,
} from "./layout-persistence.types";

export type PanelRegistry = Map<string, IJsonTabNode>;

type JsonObject = Record<string, unknown>;
type ParentNodeType = "root" | "row" | "col" | "tabset";
type RuntimeContainerNode = (IJsonRowNode | IJsonTabSetNode) & {
    active?: true;
};
type ContainerRegistry = Map<string, IJsonRowNode | IJsonTabSetNode>;

interface SerializeLayoutOptions {
    knownTabIds?: ReadonlySet<string>;
}

interface NormalizeNodeInput {
    knownTabIds: ReadonlySet<string>;
    parentType: ParentNodeType;
    usedTabIds: Set<string>;
}

export function buildPanelRegistry(layoutModel: IJsonModel): PanelRegistry {
    const registry: PanelRegistry = new Map();
    collectTabsFromNode(layoutModel.layout, registry);

    if (layoutModel.borders) {
        layoutModel.borders.forEach((border) => border.children.forEach((tab) => addTabToRegistry(tab, registry)));
    }

    if (layoutModel.popouts) {
        Object.values(layoutModel.popouts).forEach((popout) => collectTabsFromNode(popout.layout, registry));
    }

    return registry;
}

export function getKnownPanelIds(registry: PanelRegistry): ReadonlySet<string> {
    return new Set(registry.keys());
}

export function serializeLayoutModel(model: IJsonModel, options: SerializeLayoutOptions = {}): PersistedLayoutModel {
    const layout = serializeLayoutNode(model.layout, options);

    return {
        version: PERSISTED_LAYOUT_VERSION,
        layout: layout ?? { type: "row", children: [] },
    };
}

export function normalizePersistedLayoutModel(
    rawModel: unknown,
    knownTabIds: ReadonlySet<string>,
): PersistedLayoutModel | null {
    if (!isJsonObject(rawModel) || rawModel.version !== PERSISTED_LAYOUT_VERSION) return null;

    const usedTabIds = new Set<string>();
    const layout = normalizePersistedLayoutNode(rawModel.layout, {
        knownTabIds,
        parentType: "root",
        usedTabIds,
    });

    if (!layout || layout.type === "tab") return null;

    return {
        version: PERSISTED_LAYOUT_VERSION,
        layout,
    };
}

export function hydratePersistedLayoutModel(
    persistedModel: PersistedLayoutModel | null,
    workspaceLayout: IJsonModel,
    panelRegistry: PanelRegistry = buildPanelRegistry(workspaceLayout),
): IJsonModel {
    if (!persistedModel) return cloneLayoutValue(workspaceLayout);

    const containerRegistry = buildContainerRegistry(workspaceLayout);
    const hydratedLayout = hydratePersistedLayoutNode(persistedModel.layout, {
        panelRegistry,
        containerRegistry,
        workspaceRoot: workspaceLayout.layout,
    }, true);
    if (!hydratedLayout || hydratedLayout.type === "tab") return cloneLayoutValue(workspaceLayout);

    const hydratedModel = cloneLayoutValue(workspaceLayout);
    hydratedModel.layout = hydratedLayout as IJsonRowNode;
    return hydratedModel;
}

function serializeLayoutNode(node: unknown, options: SerializeLayoutOptions = {}): PersistedLayoutNode | null {
    if (!isJsonObject(node)) return null;

    const type = getNodeType(node);
    if (type === "tab") return serializeTabNode(node, options);
    if (type !== "row" && type !== "col" && type !== "tabset") return null;

    const serializedChildren = Array.isArray(node.children)
        ? node.children.flatMap((child) => {
            const serializedChild = serializeLayoutNode(child, options);
            return serializedChild ? [serializedChild] : [];
        })
        : [];

    const serializedNode: PersistedLayoutNode = {
        type,
        children: serializedChildren,
    };

    if (isStableLayoutId(node.id)) {
        serializedNode.id = node.id;
    }

    if (isValidPersistedWeight(node.weight)) {
        serializedNode.weight = node.weight;
    }

    if (node.active === true) {
        serializedNode.active = true;
    }

    return serializedNode;
}

function serializeTabNode(node: JsonObject, options: SerializeLayoutOptions): PersistedLayoutNode | null {
    const tabId = getStableTabId(node, options.knownTabIds);
    return tabId ? { type: "tab", id: tabId } : null;
}

function getStableTabId(node: JsonObject, knownTabIds?: ReadonlySet<string>): string | null {
    if (isStableLayoutId(node.id) && (!knownTabIds || knownTabIds.has(node.id))) {
        return node.id;
    }

    return null;
}

function normalizePersistedLayoutNode(node: unknown, input: NormalizeNodeInput): PersistedLayoutNode | null {
    if (!isJsonObject(node)) return null;

    const type = getNodeType(node);
    if (type === "tab") return normalizeTabNode(node, input);
    if (type !== "row" && type !== "col" && type !== "tabset") return null;
    if (input.parentType === "tabset") return null;

    const childParentType = type;
    const children = Array.isArray(node.children)
        ? node.children.flatMap((child) => {
            const normalizedChild = normalizePersistedLayoutNode(child, {
                ...input,
                parentType: childParentType,
            });
            return normalizedChild ? [normalizedChild] : [];
        })
        : [];

    if (children.length === 0) return null;
    if (type === "tabset" && children.some((child) => child.type !== "tab")) return null;

    const normalizedNode: PersistedLayoutContainerNode = {
        type,
        children,
    };

    if (isStableLayoutId(node.id)) {
        normalizedNode.id = node.id;
    }

    if (isValidPersistedWeight(node.weight)) {
        normalizedNode.weight = node.weight;
    }

    if (node.active === true) {
        normalizedNode.active = true;
    }

    return normalizedNode;
}

function normalizeTabNode(node: JsonObject, input: NormalizeNodeInput): PersistedLayoutTabNode | null {
    if (input.parentType !== "tabset") return null;
    if (!isStableLayoutId(node.id)) return null;
    if (!input.knownTabIds.has(node.id)) return null;
    if (input.usedTabIds.has(node.id)) return null;

    input.usedTabIds.add(node.id);
    return {
        type: "tab",
        id: node.id,
    };
}

interface HydrateNodeInput {
    panelRegistry: PanelRegistry;
    containerRegistry: ContainerRegistry;
    workspaceRoot: IJsonRowNode;
}

function hydratePersistedLayoutNode(
    node: PersistedLayoutNode,
    input: HydrateNodeInput,
    useWorkspaceRoot = false,
): IJsonRowNode | IJsonTabSetNode | IJsonTabNode | null {
    if (node.type === "tab") {
        const tabConfig = input.panelRegistry.get(node.id);
        if (!tabConfig) return null;

        return {
            ...cloneLayoutValue(tabConfig),
            id: node.id,
        };
    }

    const hydratedChildren = node.children.flatMap((child) => {
        const hydratedChild = hydratePersistedLayoutNode(child, input);
        return hydratedChild ? [hydratedChild] : [];
    });

    if (node.type === "tabset") {
        const tabChildren = hydratedChildren.filter(isJsonTabNode);
        if (tabChildren.length === 0) return null;

        return assignContainerShape(createContainerBase(node, input, useWorkspaceRoot), node, tabChildren);
    }

    const rowChildren = hydratedChildren.filter(isJsonRowChildNode);
    if (rowChildren.length === 0) return null;

    return assignContainerShape(createContainerBase(node, input, useWorkspaceRoot), node, rowChildren);
}

function createContainerBase(
    node: Exclude<PersistedLayoutNode, { type: "tab" }>,
    input: HydrateNodeInput,
    useWorkspaceRoot: boolean,
): RuntimeContainerNode {
    const workspaceNode = getWorkspaceContainerNode(node, input, useWorkspaceRoot);
    if (workspaceNode) {
        return cloneLayoutValue(workspaceNode) as RuntimeContainerNode;
    }

    return {
        type: node.type,
        children: [],
    };
}

function getWorkspaceContainerNode(
    node: Exclude<PersistedLayoutNode, { type: "tab" }>,
    input: HydrateNodeInput,
    useWorkspaceRoot: boolean,
): IJsonRowNode | IJsonTabSetNode | null {
    if (node.id) {
        const workspaceNode = input.containerRegistry.get(node.id);
        if (workspaceNode && workspaceNode.type === node.type) return workspaceNode;
    }

    if (useWorkspaceRoot && node.type === input.workspaceRoot.type) return input.workspaceRoot;
    return null;
}

function assignContainerShape<T extends RuntimeContainerNode>(
    hydratedNode: T,
    node: Exclude<PersistedLayoutNode, { type: "tab" }>,
    children: IJsonRowNode["children"] | IJsonTabSetNode["children"],
): T {
    hydratedNode.type = node.type;
    hydratedNode.children = children as IJsonRowNode["children"] & IJsonTabSetNode["children"];

    if (node.id) {
        hydratedNode.id = node.id;
    }

    if (node.weight) {
        hydratedNode.weight = node.weight;
    }

    if (node.active === true) {
        hydratedNode.active = true;
    }

    return hydratedNode;
}

function buildContainerRegistry(layoutModel: IJsonModel): ContainerRegistry {
    const registry: ContainerRegistry = new Map();
    collectContainersFromNode(layoutModel.layout, registry);

    if (layoutModel.popouts) {
        Object.values(layoutModel.popouts).forEach((popout) => collectContainersFromNode(popout.layout, registry));
    }

    return registry;
}

function collectContainersFromNode(node: unknown, registry: ContainerRegistry): void {
    if (!isJsonObject(node)) return;
    const type = getNodeType(node);

    if (isRuntimeContainerNode(node) && isStableLayoutId(node.id)) {
        registry.set(node.id, cloneLayoutValue(node));
    }

    if (!Array.isArray(node.children)) return;
    node.children.forEach((child) => collectContainersFromNode(child, registry));
}

function collectTabsFromNode(node: unknown, registry: PanelRegistry): void {
    if (!isJsonObject(node)) return;

    if (node.type === "tab") {
        addTabToRegistry(node as IJsonTabNode, registry);
        return;
    }

    if (!Array.isArray(node.children)) return;
    node.children.forEach((child) => collectTabsFromNode(child, registry));
}

function addTabToRegistry(tab: IJsonTabNode, registry: PanelRegistry): void {
    const id = getStablePanelId(tab);
    if (!id || registry.has(id)) return;

    registry.set(id, cloneLayoutValue(tab));
}

function getStablePanelId(tab: IJsonTabNode): string | null {
    if (isStableLayoutId(tab.id)) return tab.id;
    return null;
}

function isJsonTabNode(node: IJsonRowNode | IJsonTabSetNode | IJsonTabNode): node is IJsonTabNode {
    return node.type === "tab";
}

function isJsonRowChildNode(node: IJsonRowNode | IJsonTabSetNode | IJsonTabNode): node is IJsonRowNode | IJsonTabSetNode {
    return node.type === "row" || node.type === "col" || node.type === "tabset";
}

function isRuntimeContainerNode(node: unknown): node is IJsonRowNode | IJsonTabSetNode {
    if (!isJsonObject(node)) return false;
    const type = getNodeType(node);
    return (type === "row" || type === "col" || type === "tabset") && Array.isArray(node.children);
}

function isValidPersistedWeight(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function cloneLayoutValue<T>(value: T): T {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
}

function isJsonObject(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStableLayoutId(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0 && !value.startsWith("#");
}

function getNodeType(node: JsonObject): string | undefined {
    return typeof node.type === "string" ? node.type : undefined;
}
