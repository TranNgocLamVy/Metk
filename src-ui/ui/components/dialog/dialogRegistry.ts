import { OpenFileDialog } from "./OpenFileDialog";
import { FormDialog } from "./FormDialog";
import { PermissionDialog } from "./PermissionDialog";
import { SaveDialog } from "./SaveDialog";
import { EditTilesetDialog } from "../../dialogs/edit-tileset/EditTilesetDialog";
import { EditRulesetDialog } from "../../dialogs/edit-ruleset/EditRulesetDialog";

export const DIALOG_TYPES = {
    FORM: 'FORM_DIALOG',
    SAVE: 'SAVE_DIALOG',
    PERMISSION: 'PERMISSION_DIALOG',
    OPEM_FILE: 'OPEN_FILE_DIALOG',
    EDIT_TILESET: 'EDIT_TILESET_MODAL',
    EDIT_RULESET: 'EDIT_RULESET_MODAL',
} as const;
export type DialogType = typeof DIALOG_TYPES[keyof typeof DIALOG_TYPES];

// Mapping Component
export const DialogRegistry: Record<string, React.FC<any>> = {
    [DIALOG_TYPES.FORM]: FormDialog,
    [DIALOG_TYPES.SAVE]: SaveDialog,
    [DIALOG_TYPES.PERMISSION]: PermissionDialog,
    [DIALOG_TYPES.OPEM_FILE]: OpenFileDialog,
    [DIALOG_TYPES.EDIT_TILESET]: EditTilesetDialog,
    [DIALOG_TYPES.EDIT_RULESET]: EditRulesetDialog
};

export interface BaseDialogProps {
    dialogId: string;
}
