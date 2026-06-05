

export const ShowEntityName = {
    Never: "never",
    Always: "always",
    Selected: "selected",
    Hovered: "hovered",
} as const;
export type ShowEntityName = typeof ShowEntityName[keyof typeof ShowEntityName];


export const Snapping = {
    NoSnap: "noSnap",
    SnapToGrid: "snapToGrid",
    SnapToFineGrid: "snapToFineGrid",
    SnapToPixel: "snapToPixel",
}
export type Snapping = typeof Snapping[keyof typeof Snapping];

export const SETTING_KEYS = {
    Layout: {
        Console: "general.layout.console",
        Issues: "general.layout.issues",
        Properties: "general.layout.properties",
        Layers: "general.layout.layers",
        Entities: "general.layout.entities",
        Tilesets: "general.layout.tilesets",
        Rulesets: "general.layout.rulesets",
    },
    View: {
        ShowGrid: "general.view.showGrid",
        ShowEntityOutline: "general.view.showEntityOutline",
        ShowEntityName: "general.view.showEntityName",
        ShowTileAnimations: "general.view.showTileAnimations",
        ShowTileCollisionShapes: "general.view.showTileCollisionShapes",
        EnableParallax: "general.view.enableParallax",
        HighlightCurrentLayer: "general.view.highlightCurrentLayer",
        HighlightHoveredEntity: "general.view.highlightHoveredEntity",
        Snapping: "general.view.snapping",
    },
} as const;
