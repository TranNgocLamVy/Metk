

export const ShowEntityName = {
    Never: "never",
    ForSelectedEntities: "forSelectedEntities",
    ForAllEntities: "forAllEntities",
    ForHoveredEntitie: "forHoverEntities",
} as const;
export type ShowEntityName = typeof ShowEntityName[keyof typeof ShowEntityName];


export const Snapping = {
    NoSnap: "noSnap",
    SnapToGrid: "snapToGrid",
    SnapToFineGrid: "snapToFineGrid",
    SnapToPixel: "snapToPixel",
}
export type Snapping = typeof Snapping[keyof typeof Snapping];