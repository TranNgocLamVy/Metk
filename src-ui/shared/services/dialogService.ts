import { PermissionDialogOptions } from "@/shared/types/dialogs/permissionDialog";
import { useDialogStore } from "@/view/stores/menu/dialogStore";

import { SaveDialogOptions, SaveResult } from "../types/dialogs/saveDialog";

export class DialogService {
    public static async openPermissionDialog(opts: PermissionDialogOptions): Promise<boolean> {
        return useDialogStore.getState().openPermissionDialog(opts);
    }

    public static async openSaveDialog(opts: SaveDialogOptions): Promise<SaveResult> {
        return useDialogStore.getState().openSaveDialog(opts);
    }
}