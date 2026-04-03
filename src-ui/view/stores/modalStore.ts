import { create } from "zustand";

type ModalOptions = {
    
}

interface ModalState {
    activeModal: string | null;
    options: ModalOptions;
    props: any;
    openModal: (options: ModalOptions & { modalName: string }, props?: any) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    activeModal: null,
    options: {},
    props: {},
    openModal: (options, props = {}) => set({ activeModal: options.modalName, options, props }),
    closeModal: () => set({ activeModal: null, props: {}, options: {} }),
}));