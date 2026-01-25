import { createPortal } from "react-dom";
import { Fragment } from "react/jsx-runtime";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/view/components/shadcn/alert-dialog";
import { useDialogStore } from "@/view/stores/menu/dialogStore";

export function SaveDialog() {
	const permissionDialogs = useDialogStore((s) => s.saveDialog);
	const closePermissionDialog = useDialogStore((s) => s.closeSaveDialog);

    if (!permissionDialogs) return null;

	return (
		<Fragment>
			{createPortal(
				<AlertDialog open={true}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{permissionDialogs.title}</AlertDialogTitle>
							<AlertDialogDescription>{permissionDialogs.description}</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogAction onClick={() => closePermissionDialog("save")}>{"Save"}</AlertDialogAction>
							<AlertDialogAction onClick={() => closePermissionDialog("not save")} variant={"destructive"}>{"Don't save"}</AlertDialogAction>
							<AlertDialogCancel onClick={() => closePermissionDialog("cancel")}>{"Cancel"}</AlertDialogCancel>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>,
				document.body,
			)}
		</Fragment>
	);
}
