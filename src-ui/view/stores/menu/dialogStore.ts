import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

import { Field, FormDialogItem, FormDialogOptions, ShapeFromInputs, Simplify } from "@/shared/types/dialogs/formDialog";
import { PermissionDialogItem, PermissionDialogOptions } from "@/shared/types/dialogs/permissionDialog";

interface DialogStore {
    // Permission dialogs (multiple allowed)
    permissionDialogs: PermissionDialogItem[];
    openPermissionDialog: (opts: PermissionDialogOptions) => Promise<boolean>;
    closePermissionDialog: (id: string, result: boolean) => void;

    // Form dialog (single at a time)
    // The store itself can't be generic; each call to openFormDialog narrows via its generic.
    formDialog: FormDialogItem<any> | null;
    openFormDialog: <const I extends readonly Field[]>(
        opts: FormDialogOptions<I>
    ) => Promise<Simplify<ShapeFromInputs<I>>>;
    closeFormDialog: (result: any) => void;
    cancelFormDialog: () => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
    permissionDialogs: [],
    openPermissionDialog: (opts) => {
        const id = uuidv4();
        return new Promise<boolean>((resolve) => {
            set((state) => ({
                permissionDialogs: [
                    ...state.permissionDialogs,
                    { ...opts, id, resolve },
                ],
            }));
        });
    },
    closePermissionDialog: (id, result) => {
        const { permissionDialogs } = get();
        const dialog = permissionDialogs.find((d) => d.id === id);
        if (dialog) {
            dialog.resolve(result);
            set((state) => ({
                permissionDialogs: state.permissionDialogs.filter((d) => d.id !== id),
            }));
        }
    },

    formDialog: null,
    openFormDialog: <const I extends readonly Field[]>(opts: FormDialogOptions<I>) => {
        const id = uuidv4();
        return new Promise<Simplify<ShapeFromInputs<I>>>((resolve) => {
            set({ formDialog: { ...opts, id, resolve } as any });
        });
    },

    closeFormDialog: (result) => {
        const { formDialog } = get();
        if (!formDialog) return;
        formDialog.resolve(result);
        set({ formDialog: null });
    },

    cancelFormDialog: () => {
        const { formDialog } = get();
        if (!formDialog) return;
        formDialog.resolve(null);
        set({ formDialog: null });
    },
}));