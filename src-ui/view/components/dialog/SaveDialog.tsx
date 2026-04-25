import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/view/components/shadcn/alert-dialog";
import { BaseDialogProps } from "./dialogRegistry";
import { SaveDialogOptions } from "@/shared/types/confirmationDialog";
import { useDialogStore } from "@/view/stores/dialogStore";
import { useTranslation } from "react-i18next";

interface SaveDialogProps extends BaseDialogProps {
    saveDialog: SaveDialogOptions;
    resolve: (value: string) => void;
}

export function SaveDialog({ resolve, dialogId, saveDialog }: SaveDialogProps) {
    const { t: translate } = useTranslation();
    
    const { closeDialog } = useDialogStore();

    const { title, description } = saveDialog;

    const closePermissionDialog = (result: string) => {
        closeDialog(dialogId);
        resolve(result);
    }

    const onOpenChange = (open: boolean) => {
        if (!open) {
            resolve("cancel")
            closeDialog(dialogId);
        }
    }

    return (
        <AlertDialog open onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{translate(title)}</AlertDialogTitle>
                    <AlertDialogDescription>{translate(description)}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => closePermissionDialog("save")}>{translate("global.actionsave")}</AlertDialogAction>
                    <AlertDialogAction onClick={() => closePermissionDialog("not save")} variant={"destructive"}>{translate("global.actionnotSave")}</AlertDialogAction>
                    <AlertDialogCancel onClick={() => closePermissionDialog("cancel")}>{translate("global.actioncancel")}</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
