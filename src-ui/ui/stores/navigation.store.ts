import { create } from "zustand";

type NavigationState = {
	navigate: ((path: string) => void) | null;
	setNavigate: (fn: (path: string) => void) => void;
};

export const useNavigationStore = create<NavigationState>((set) => ({
	navigate: null,
	setNavigate: (fn) => set({ navigate: fn }),
}));
