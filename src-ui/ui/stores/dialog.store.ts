import { appKernel } from '@/application/bootstrap/app-kernel';
import { DialogConfig, DialogItem } from '@/shared/types/dialog';
import { DialogType } from '@/ui/components/dialog/dialogRegistry';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

type DialogState = {
    dialogs: DialogItem[];
}

export type DialogActions = {
    openDialog: <T>(type: DialogType, config: DialogConfig, params?: T) => string;
    closeDialog: (id: string) => void;
    closeTopDialog: () => void;
    closeAll: () => void;
}

type DialogStore = DialogState & {
    actions: DialogActions;
}

const useDialogStore = create<DialogStore>((set, get) => ({
    dialogs: [],

    actions: {
        openDialog: (type, config, params) => {
            const id = uuidv4();
            set((state) => ({ dialogs: [...state.dialogs, { id, type, params, config }] }));
            appKernel.activationContext.setFlag("isModalOpen", true, id);
            return id;
        },

        closeDialog: (id) => {
            set((state) => ({ dialogs: state.dialogs.filter((dialog) => dialog.id !== id) }));
            appKernel.activationContext.setFlag("isModalOpen", false, id);
        },

        closeTopDialog: () => {
            const topDialog = get().dialogs[0];
            if (topDialog) get().actions.closeDialog(topDialog.id);
        },

        closeAll: () => {
            get().dialogs.forEach((dialog) => get().actions.closeDialog(dialog.id));
        },
    },
}));

export const useDialogs = () => useDialogStore((state) => state.dialogs);
export const useDialogActions = () => useDialogStore((state) => state.actions);

export const getDialogStoreState = () => useDialogStore.getState();
export const resetDialogStoreForTest = () => useDialogStore.setState(useDialogStore.getInitialState(), true);
export const setDialogStoreStateForTest = (state: Partial<DialogState>) => useDialogStore.setState(state);
export const setDialogStoreActionsForTest = (actions: Partial<DialogActions>) => {
    useDialogStore.setState((state) => ({ actions: { ...state.actions, ...actions } }));
};
