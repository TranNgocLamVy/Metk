import { Fragment } from "react/jsx-runtime";

import { FormDialog } from "./formDialog";
import { PermissionDialog } from "./permissionDialog";
import { SaveDialog } from "./saveDialog";

export function DialogContainer() {
	return (
		<Fragment>
			<PermissionDialog />
			<FormDialog />
			<SaveDialog />
		</Fragment>
	);
}
