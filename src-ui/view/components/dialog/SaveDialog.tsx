import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/view/components/shadcn/alert-dialog";
import { BaseDialogProps } from "./dialogRegistry";
import { SaveDialogOptions } from "@/shared/types/confirmationDialog";
import { useDialogStore } from "@/view/stores/dialogStore";

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
        <AlertDialog defaultOpen onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => closePermissionDialog("save")}>{"Save"}</AlertDialogAction>
                    <AlertDialogAction onClick={() => closePermissionDialog("not save")} variant={"destructive"}>{"Don't save"}</AlertDialogAction>
                    <AlertDialogCancel onClick={() => closePermissionDialog("cancel")}>{"Cancel"}</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
