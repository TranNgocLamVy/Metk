import { appKernel } from '@/application/bootstrap/app-kernel';
import { DialogConfig, DialogItem } from '@/shared/types/dialog';
import { DialogType } from '@/ui/components/dialog/dialogRegistry';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

interface DialogState {
    dialogs: DialogItem[];
    
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
        appKernel.activationContext.setFlag("isModalOpen", true, id);
        return id;
    },

    closeDialog: (id) => {
        set((state) => ({ dialogs: state.dialogs.filter((dialog) => dialog.id !== id), }));
        appKernel.activationContext.setFlag("isModalOpen", false, id);
    },

    closeTopDialog: () => {
        const topDialog = get().dialogs[0];
        if (topDialog) get().closeDialog(topDialog.id);
    },

    closeAll: () => {
        get().dialogs.forEach(dialog => get().closeDialog(dialog.id));
    },
}));