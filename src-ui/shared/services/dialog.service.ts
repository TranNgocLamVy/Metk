import { useDialogStore } from "@/ui/stores/dialog.store";
import { Field, FormDialogOptions, ShapeFromInputs, Simplify } from "@/shared/types/form-dialog";
import { PermissionDialogOptions, SaveDialogOptions, SaveResult } from "../types/confirmation-dialog";
import { DialogZLevel } from "../types/dialog";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { Result } from "../types/result";


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
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return;

        const rulesetManager = currentProject.rulesetManager;

        const ruleset = await rulesetManager.loadRuleset(id);
        if (!ruleset) return;
        
        useDialogStore.getState().openDialog("EDIT_RULESET_MODAL", { zLevel: DialogZLevel.Modal }, { rulesetId: id })
    }

    public static async openEditEntityDefinitionDialog(entityCollectionId: string, entityId: string): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return;

        const entityCollectionManager = currentProject.entityCollectionManager;
        const loadResult = await entityCollectionManager.loadEntityCollection(entityCollectionId);

        if (loadResult.status !== Result.Status.Success) return;

        const entity = loadResult.data.getEntityDefinitionById(entityId);
        if (!entity) return;

        useDialogStore
            .getState()
            .openDialog(
                "EDIT_ENTITY_DEFINITION_MODAL",
                { zLevel: DialogZLevel.Modal },
                { entityCollectionId, entityId },
            );
    }

    public static async openEditTilesetDialog(id: string): Promise<void> {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return;
    
        const tilesetManager = currentProject.tilesetManager;
        const loadResult = await tilesetManager.loadTileset(id);
    
        if (loadResult.status !== Result.Status.Success) return;
    
        useDialogStore
            .getState()
            .openDialog(
                "EDIT_TILESET_MODAL",
                { zLevel: DialogZLevel.Modal },
                { tilesetId: id },
            );
    }
}
