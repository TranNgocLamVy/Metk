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

type ToolbarStore = {
    groups: ToolBarGroupDisplayData[];
    activeFamilyId: string | null;
    availableFamilyIds: string[];

    setGroups: (groups: ToolBarGroupDisplayData[]) => void;
    setActiveFamilyId: (activeFamilyId: string | null) => void;
    setAvailableFamilyIds: (availableFamilyIds: string[]) => void;
}

export const useToolbarStore = create<ToolbarStore>((set, get) => ({
    groups: [],
    activeFamilyId: null,
    availableFamilyIds: [],

    setGroups: (groups: ToolBarGroupDisplayData[]) => set({ groups }),
    setActiveFamilyId: (activeFamilyId: string | null) => set({ activeFamilyId }),
    setAvailableFamilyIds: (availableFamilyIds: string[]) => set({ availableFamilyIds }),
}))
