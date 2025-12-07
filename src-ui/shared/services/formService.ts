import { Field, FormDialogOptions, ShapeFromInputs, Simplify } from "@/shared/types/dialogs/formDialog";
import { PermissionDialogOptions } from "@/shared/types/dialogs/permissionDialog";
import { useDialogStore } from "@/view/stores/menu/dialogStore";

export class FormService {
    public static async openPermissionDialog(opts: PermissionDialogOptions): Promise<boolean> {
        return useDialogStore.getState().openPermissionDialog(opts);
    }

    public static async openFormDialog<const I extends readonly Field[]>(opts: FormDialogOptions<I>): Promise<Simplify<ShapeFromInputs<I>> | null> {
        return useDialogStore.getState().openFormDialog(opts);
    }

    public static createForm<const I extends readonly Field[]>(opts: FormDialogOptions<I>) {
        return opts;
    }
}