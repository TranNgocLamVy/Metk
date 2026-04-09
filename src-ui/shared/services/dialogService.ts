import { useDialogStore } from "@/view/stores/dialogStore";
import { Field, FormDialogOptions, ShapeFromInputs, Simplify } from "@/shared/types/formDialog";
import { PermissionDialogOptions, SaveDialogOptions, SaveResult } from "../types/confirmationDialog";


export class DialogService {
    public static openFormDialog<const I extends readonly Field[]>(opts: FormDialogOptions<I>): Promise<Simplify<ShapeFromInputs<I>> | null> {
        return new Promise<Simplify<ShapeFromInputs<I>> | null>((resolve) => {
            useDialogStore.getState().openDialog("FORM_DIALOG", { resolve, formDialog: opts });
        })
    }

    public static async openPermissionDialog(opts: PermissionDialogOptions): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            useDialogStore.getState().openDialog("PERMISSION_DIALOG", { resolve, permissionDialog: opts });
        });
    }

    public static async openSaveDialog(opts: SaveDialogOptions): Promise<SaveResult> {
        return new Promise<SaveResult>((resolve) => {
            useDialogStore.getState().openDialog("SAVE_DIALOG", { resolve, saveDialog: opts });
        });
    }
}