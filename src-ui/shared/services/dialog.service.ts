import { useDialogStore } from "@/ui/stores/dialog.store";
import { Field, FormDialogOptions, ShapeFromInputs, Simplify } from "@/shared/types/form-dialog";
import { PermissionDialogOptions, SaveDialogOptions, SaveResult } from "../types/confirmation-dialog";
import { DialogZLevel } from "../types/dialog";
import { appKernel } from "@/application/bootstrap/app-kernel";


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
        const currentProject = appKernel.editorContext.currentProject;
        if (!currentProject) return;

        const rulesetManager = currentProject.rulesetManager;

        const ruleset = await rulesetManager.loadRuleset(id);
        if (!ruleset) return;
        
        useDialogStore.getState().openDialog("EDIT_RULESET_MODAL", { zLevel: DialogZLevel.Modal }, { rulesetId: id })
    }
}