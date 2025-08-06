import { create } from "zustand";

export type UIViewOptionsState = {
    showProject: boolean;
    toggleShowProject: () => void;

    showConsole: boolean;
    toggleShowConsole: () => void;

    showIssues: boolean;
    toggleShowIssues: () => void;

    showProperties: boolean;
    toggleShowProperties: () => void;

    showLayers: boolean;
    toggleShowLayers: () => void;

    showHistory: boolean;
    toggleShowHistory: () => void;

    showObjects: boolean;
    toggleShowObjects: () => void;

    showTemplateEditor: boolean;
    toggleShowTemplateEditor: () => void;

    showTilesets: boolean;
    toggleShowTilesets: () => void;

    showTerrainSets: boolean;
    toggleShowTerrainSets: () => void;

    showMinimap: boolean;
    toggleShowMinimap: () => void;

    showTileStamps: boolean;
    toggleShowTileStamps: () => void;

    showMainToolbar: boolean;
    toggleShowMainToolbar: () => void;

    showTools: boolean;
    toggleShowTools: () => void;

    showToolOptions: boolean;
    toggleShowToolOptions: () => void;
}

export const useUIViewOptions = create<UIViewOptionsState>((set) => ({
    showProject: false,
    toggleShowProject: () => set((state) => ({ showProject: !state.showProject })),

    showConsole: false,
    toggleShowConsole: () => set((state) => ({ showConsole: !state.showConsole })),

    showIssues: false,
    toggleShowIssues: () => set((state) => ({ showIssues: !state.showIssues })),

    showProperties: false,
    toggleShowProperties: () => set((state) => ({ showProperties: !state.showProperties })),

    showLayers: false,
    toggleShowLayers: () => set((state) => ({ showLayers: !state.showLayers })),

    showHistory: false,
    toggleShowHistory: () => set((state) => ({ showHistory: !state.showHistory })),

    showObjects: false,
    toggleShowObjects: () => set((state) => ({ showObjects: !state.showObjects })),

    showTemplateEditor: false,
    toggleShowTemplateEditor: () => set((state) => ({ showTemplateEditor: !state.showTemplateEditor })),

    showTilesets: false,
    toggleShowTilesets: () => set((state) => ({ showTilesets: !state.showTilesets })),

    showTerrainSets: false,
    toggleShowTerrainSets: () => set((state) => ({ showTerrainSets: !state.showTerrainSets })),

    showMinimap: false,
    toggleShowMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),

    showTileStamps: false,
    toggleShowTileStamps: () => set((state) => ({ showTileStamps: !state.showTileStamps })),

    showMainToolbar: false,
    toggleShowMainToolbar: () => set((state) => ({ showMainToolbar: !state.showMainToolbar })),

    showTools: false,
    toggleShowTools: () => set((state) => ({ showTools: !state.showTools })),

    showToolOptions: false,
    toggleShowToolOptions: () => set((state) => ({ showToolOptions: !state.showToolOptions })),
}))
