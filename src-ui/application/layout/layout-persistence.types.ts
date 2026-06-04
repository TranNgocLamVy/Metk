export const PERSISTED_LAYOUT_VERSION = 1;

export type PersistedLayoutVersion = typeof PERSISTED_LAYOUT_VERSION;

export interface PersistedLayoutModel {
    version: PersistedLayoutVersion;
    layout: PersistedLayoutNode;
}

export type PersistedLayoutNode = PersistedLayoutContainerNode | PersistedLayoutTabNode;

export type PersistedLayoutContainerType = "row" | "col" | "tabset";

export interface PersistedLayoutContainerNode {
    type: PersistedLayoutContainerType;
    id?: string;
    weight?: number;
    active?: true;
    children: PersistedLayoutNode[];
}

export interface PersistedLayoutTabNode {
    type: "tab";
    id: string;
}
