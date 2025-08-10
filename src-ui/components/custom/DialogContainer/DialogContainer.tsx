import { Fragment } from "react/jsx-runtime";

import { FormDialog } from "./FormDialog";
import { PermissionDialog } from "./PermissionDialog";

export function DialogContainer() {
	return (
		<Fragment>
			<PermissionDialog />
			<FormDialog />
		</Fragment>
	);
}
