import { useDialogStore } from "@/view/stores/dialogStore";
import { Field, FormDialogOptions, ShapeFromInputs, Simplify } from "@/shared/types/formDialog";
import { PermissionDialogOptions, SaveDialogOptions, SaveResult } from "../types/confirmationDialog";
import { DialogZLevel } from "../types/dialog";
import { AppCore } from "@/core/appcore";
import { ToastService } from "./toastService";


export class DialogService {
    public static openFormDialog<const I extends readonly Field[]>(opts: FormDialogOptions<I>): Promise<Simplify<ShapeFromInputs<I>> | null> {
        return new Promise<Simplify<ShapeFromInputs<I>> | null>((resolve) => {
            useDialogStore.getState().openDialog("FORM_DIALOG", { zLevel: DialogZLevel.Modal }, { resolve, formDialog: opts });
        })
    }

    public static async openPermissionDialog(opts: PermissionDialogOptions): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            useDialogStore.getState().openDialog("PERMISSION_DIALOG", { zLevel: DialogZLevel.AlertDialog }, { resolve, permissionDialog: opts });
        });
    }

    public static async openSaveDialog(opts: SaveDialogOptions): Promise<SaveResult> {
        return new Promise<SaveResult>((resolve) => {
            useDialogStore.getState().openDialog("SAVE_DIALOG", { zLevel: DialogZLevel.AlertDialog }, { resolve, saveDialog: opts });
        });
    }

    public static async openEditRulesetDialog(id: string): Promise<void> {
        const rulesetManager = AppCore.getIns().editorContext.getCurrentProject().rulesetManager;

        const ruleset = await rulesetManager.loadRuleset(id);
        if (!ruleset) {
            ToastService.error({ message: "Ruleset not found" });
            return;
        }
        
        useDialogStore.getState().openDialog("EDIT_RULESET_MODAL", { zLevel: DialogZLevel.Modal }, { rulesetId: id })
    }
}