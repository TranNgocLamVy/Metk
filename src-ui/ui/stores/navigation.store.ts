import { create } from "zustand";

type NavigationState = {
	navigate: ((path: string) => void) | null;
};

type NavigationActions = {
	setNavigate: (fn: (path: string) => void) => void;
};

type NavigationStore = NavigationState & {
	actions: NavigationActions;
};

const useNavigationStore = create<NavigationStore>((set) => ({
	navigate: null,
	actions: {
		setNavigate: (fn) => set({ navigate: fn }),
	},
}));

export const useNavigate = () => useNavigationStore((state) => state.navigate);
export const useNavigationActions = () => useNavigationStore((state) => state.actions);

export const getNavigationStoreState = () => useNavigationStore.getState();
export const resetNavigationStoreForTest = () => useNavigationStore.setState(useNavigationStore.getInitialState(), true);
export const setNavigationStoreStateForTest = (state: Partial<NavigationState>) => useNavigationStore.setState(state);
