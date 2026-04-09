import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/view/components/shadcn/alert-dialog";
import { BaseDialogProps } from "./dialogRegistry";
import { useDialogStore } from "@/view/stores/dialogStore";
import { PermissionDialogOptions } from "@/shared/types/confirmationDialog";

interface PermissionDialogProps extends BaseDialogProps {
    permissionDialog: PermissionDialogOptions;
    resolve: (value: boolean) => void;
}

export function PermissionDialog({ resolve, dialogId, permissionDialog }: PermissionDialogProps) {
    const { closeDialog } = useDialogStore();

    const { title, description, okText = "OK", cancelText = "Cancel", okButtonVariant = "default" } = permissionDialog;

    const closePermissionDialog = (result: boolean) => {
        closeDialog(dialogId);
        resolve(result);
    }

    const onOpenChange = (open: boolean) => {
        if (!open) {
            resolve(false)
            closeDialog(dialogId);
        }
    }

    return (
        <AlertDialog open onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => closePermissionDialog(false)}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction variant={okButtonVariant} onClick={() => closePermissionDialog(true)}>{okText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
