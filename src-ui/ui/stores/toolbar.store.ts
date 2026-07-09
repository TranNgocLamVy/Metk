import { create } from "zustand";

export type ToolbarItemDisplayData = {
    id: string;
    icon?: string;
    label?: string;
    tooltip?: string;
    index: number;
    shortcuts?: string[];
    disabled?: boolean;
}

export type ToolBarGroupDisplayData = {
    id: string;
    label: string;
    items: ToolbarItemDisplayData[];
}

type ToolbarState = {
    groups: ToolBarGroupDisplayData[];
    activeFamilyId: string | null;
    availableFamilyIds: string[];
}

type ToolbarActions = {
    setGroups: (groups: ToolBarGroupDisplayData[]) => void;
    setActiveFamilyId: (activeFamilyId: string | null) => void;
    setAvailableFamilyIds: (availableFamilyIds: string[]) => void;
}

type ToolbarStore = ToolbarState & {
    actions: ToolbarActions;
}

const useToolbarStore = create<ToolbarStore>((set) => ({
    groups: [],
    activeFamilyId: null,
    availableFamilyIds: [],

    actions: {
        setGroups: (groups) => set({ groups }),
        setActiveFamilyId: (activeFamilyId) => set({ activeFamilyId }),
        setAvailableFamilyIds: (availableFamilyIds) => set({ availableFamilyIds }),
    },
}))

export const useToolbarGroups = () => useToolbarStore((state) => state.groups);
export const useActiveToolbarFamilyId = () => useToolbarStore((state) => state.activeFamilyId);
export const useAvailableToolbarFamilyIds = () => useToolbarStore((state) => state.availableFamilyIds);
export const useToolbarActions = () => useToolbarStore((state) => state.actions);

export const getToolbarStoreState = () => useToolbarStore.getState();
export const resetToolbarStoreForTest = () => useToolbarStore.setState(useToolbarStore.getInitialState(), true);
export const setToolbarStoreStateForTest = (state: Partial<ToolbarState>) => useToolbarStore.setState(state);
