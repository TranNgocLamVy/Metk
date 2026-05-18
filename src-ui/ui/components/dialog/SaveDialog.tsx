import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/ui/components/shadcn/alert-dialog";
import { BaseDialogProps } from "./dialogRegistry";
import { SaveDialogOptions } from "@/shared/types/confirmationDialog";
import { useDialogStore } from "@/ui/stores/dialogStore";
import { LocalizedText } from "../custom/LocalizeText";

interface SaveDialogProps extends BaseDialogProps {
    saveDialog: SaveDialogOptions;
    resolve: (value: string) => void;
}

export function SaveDialog({ resolve, dialogId, saveDialog }: SaveDialogProps) {
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
