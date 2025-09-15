import { useDialogStore } from "@/stores/menu/DialogStore";
import { Field, FormDialogOptions, ShapeFromInputs, Simplify } from "@/types/dialogs/formDialog";
import { PermissionDialogOptions } from "@/types/dialogs/permissionDialog";

export class DialogService {
    public static async openPermissionDialog(opts: PermissionDialogOptions): Promise<boolean> {
        return useDialogStore.getState().openPermissionDialog(opts);
    }

    public static async openFormDialog<const I extends readonly Field[]>(opts: FormDialogOptions<I>): Promise<Simplify<ShapeFromInputs<I>> | null> {
        return useDialogStore.getState().openFormDialog(opts);
    }
}