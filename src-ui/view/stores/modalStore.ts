import { create } from "zustand";

interface ModalState {
    activeModal: string | null;
    props: any;
    openModal: (name: string, props?: any) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    activeModal: null,
    props: {},
    openModal: (name, props = {}) => set({ activeModal: name, props }),
    closeModal: () => set({ activeModal: null, props: {} }),
}));