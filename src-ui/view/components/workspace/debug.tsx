
import { v1 as uuidv1 } from "uuid";

import { AppCore } from "@/core/appcore";
import { ToastService } from "@/shared/services/toastService";

import { HStack, VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function Debug() {
	const testPath = async () => {
        const project = AppCore.getIns().getCurrentProject();
        console.log(project)
	};

	return (
		<VStack className="tilesetview w-full h-full ">
			<HStack className="w-full h-full bg-secondary-background p-4 gap-2" justify="start" align="start">
				<Button onClick={testPath}>Test Path API</Button>
			</HStack>
		</VStack>
	);
}
