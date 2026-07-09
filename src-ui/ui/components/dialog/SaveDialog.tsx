import { SaveDialogOptions } from "@/shared/types/confirmation-dialog";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/ui/components/shadcn/alert-dialog";
import { useDialogActions } from "@/ui/stores/dialog.store";
import { BaseDialogProps } from "./dialogRegistry";

interface SaveDialogProps extends BaseDialogProps {
    saveDialog: SaveDialogOptions;
    resolve: (value: string) => void;
}

export function SaveDialog({ resolve, dialogId, saveDialog }: SaveDialogProps) {
    const { closeDialog } = useDialogActions();

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
                    <AlertDialogTitle><LocalizedText message={title} /></AlertDialogTitle>
                    <AlertDialogDescription><LocalizedText message={description} /></AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => closePermissionDialog("save")}><LocalizedText message="global.action.save" /></AlertDialogAction>
                    <AlertDialogAction onClick={() => closePermissionDialog("not save")} variant={"destructive"}><LocalizedText message="global.action.notSave" /></AlertDialogAction>
                    <AlertDialogCancel onClick={() => closePermissionDialog("cancel")}><LocalizedText message="global.action.cancel" /></AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
