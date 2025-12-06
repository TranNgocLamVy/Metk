import { ToastService } from "@/shared/services/toastService";
import { FileDialogUtils } from "@/shared/utils/fileDialogUtils";
import { PathUtils } from "@/shared/utils/pathUtils";
import { readTextFile } from "@tauri-apps/plugin-fs";

import { HStack, VStack } from "../custom/stack/stack";
import { Button } from "../shadcn/button";

export default function Debug() {
	const testPath = async () => {
		const path1 = "C:/Users/Project/maps";
        const path2 = "test"
        const extension = ".json"
		const result = PathUtils.join(path1, path2)
        ToastService.success({ message: result });
	};

	return (
		<VStack className="tilesetview w-full h-full ">
			<HStack className="w-full h-full bg-secondary-background p-4 gap-2" justify="start" align="start">
				<Button onClick={testPath}>Test Path API</Button>
			</HStack>
		</VStack>
	);
}
