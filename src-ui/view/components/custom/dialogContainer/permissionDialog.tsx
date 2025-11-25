import { createPortal } from "react-dom";
import { Fragment } from "react/jsx-runtime";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/view/components/shadcn/alert-dialog";
import { useDialogStore } from "@/view/stores/menu/dialogStore";

export function PermissionDialog() {
	const permissionDialogs = useDialogStore((s) => s.permissionDialogs);
	const closePermissionDialog = useDialogStore((s) => s.closePermissionDialog);

	return (
		<Fragment>
			{permissionDialogs.map(({ id, title, description, okText = "OK", cancelText = "Cancel" }) =>
				createPortal(
					<AlertDialog open={true}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{title}</AlertDialogTitle>
								<AlertDialogDescription>{description}</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel onClick={() => closePermissionDialog(id, false)}>{cancelText}</AlertDialogCancel>
								<AlertDialogAction onClick={() => closePermissionDialog(id, true)}>{okText}</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>,
					document.body
				)
			)}
		</Fragment>
	);
}
