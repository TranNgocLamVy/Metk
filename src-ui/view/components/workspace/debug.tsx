
import { AppCore } from "@/core/appcore";

import { HStack, VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function Debug() {
	const print = async () => {
        const workspace = AppCore.getIns().editorContext.getCurrentWorkspace();
        console.log(workspace)
	};

	return (
		<VStack className="w-full h-full">
			<HStack className="w-full h-full bg-secondary-background p-4 gap-2" justify="start" align="start">
				<Button onClick={print}>Print</Button>
			</HStack>
		</VStack>
	);
}
