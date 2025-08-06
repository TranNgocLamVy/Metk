import { create } from "zustand";

export type DrawingViewOptionState = {
    showGrid: boolean;
    toggleGrid: () => void;

    showTileObjectOutlines: boolean;
    toggleTileObjectOutlines: () => void;

    showObjectReferences: boolean;
    toggleObjectReferences: () => void;

    showObjectNames: ShowObjectNamesTypes;
    setShowObjectNames: (value: ShowObjectNamesTypes) => void;

    showNamesForHoveredObjects: boolean;
    toggleNamesForHoveredObjects: () => void;

    showTileAnimations: boolean;
    toggleTileAnimations: () => void;

    showTileCollisionShapes: boolean;
    toggleTileCollisionShapes: () => void;

    showWorld: boolean;
    toggleWorld: () => void;

    enableParallax: boolean;
    toggleParallax: () => void;

    highlightCurrentLayer: boolean;
    toggleHighlightCurrentLayer: () => void;

    highlightHoveredObject: boolean;
    toggleHighlightHoveredObject: () => void;

    snappingMode: SnappingModeTypes;
    setSnappingMode: (value: SnappingModeTypes) => void;
}

export const ShowObjectNamesOptions = {
    ForAllObjects: "ForAllObjects",
    ForSelectedObjects: "ForSelectedObjects",
    ForHoveredObjects: "ForHoveredObjects",
} as const;
export type ShowObjectNamesTypes = keyof typeof ShowObjectNamesOptions

export const SnappingModeOptions = {
    None: "None",
    SnapToGrid: "SnapToGrid",
    SnapToFineGrid: "SnapToFineGrid",
    SnapToPixel: "SnapToPixel",
}
export type SnappingModeTypes = keyof typeof SnappingModeOptions


export const useDrawingViewOptions = create<DrawingViewOptionState>((set) => ({
    showGrid: true,
    toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

    showTileObjectOutlines: false,
    toggleTileObjectOutlines: () => set((state) => ({ showTileObjectOutlines: !state.showTileObjectOutlines })),

    showObjectReferences: false,
    toggleObjectReferences: () => set((state) => ({ showObjectReferences: !state.showObjectReferences })),

    showObjectNames: "ForAllObjects",
    setShowObjectNames: (value) => set({ showObjectNames: value }),

    showNamesForHoveredObjects: false,
    toggleNamesForHoveredObjects: () => set((state) => ({ showNamesForHoveredObjects: !state.showNamesForHoveredObjects })),

    showTileAnimations: false,
    toggleTileAnimations: () => set((state) => ({ showTileAnimations: !state.showTileAnimations })),

    showTileCollisionShapes: false,
    toggleTileCollisionShapes: () => set((state) => ({ showTileCollisionShapes: !state.showTileCollisionShapes })),

    showWorld: false,
    toggleWorld: () => set((state) => ({ showWorld: !state.showWorld })),

    enableParallax: false,
    toggleParallax: () => set((state) => ({ enableParallax: !state.enableParallax })),

    highlightCurrentLayer: false,
    toggleHighlightCurrentLayer: () => set((state) => ({ highlightCurrentLayer: !state.highlightCurrentLayer })),

    highlightHoveredObject: false,
    toggleHighlightHoveredObject: () => set((state) => ({ highlightHoveredObject: !state.highlightHoveredObject })),

    snappingMode: "None",
    setSnappingMode: (value) => set({ snappingMode: value }),
}));