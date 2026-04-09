import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { DialogConfig, DialogItem } from '@/shared/types/dialog';
import { DialogType } from '../components/dialog/dialogRegistry';

interface DialogState {
    dialogs: DialogItem[];
    // Actions
    openDialog: <T>(type: DialogType, config: DialogConfig, params?: T) => string;
    closeDialog: (id: string) => void;
    closeTopDialog: () => void;
    closeAll: () => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
    dialogs: [],

    openDialog: (type, config, params) => {
        const id = uuidv4();
        set((state) => ({ dialogs: [...state.dialogs, { id, type, params, config }], }));
        return id;
    },

    closeDialog: (id) => {
        set((state) => ({ dialogs: state.dialogs.filter((dialog) => dialog.id !== id), }));
    },

    closeTopDialog: () => {
        set((state) => ({ dialogs: state.dialogs.slice(0, -1), }));
    },

    closeAll: () => {
        set({ dialogs: [] });
    },
}));