import { Fragment } from "react/jsx-runtime";

import { FormDialog } from "./formDialog";
import { PermissionDialog } from "./permissionDialog";

export function DialogContainer() {
	return (
		<Fragment>
			<PermissionDialog />
			<FormDialog />
		</Fragment>
	);
}
