import { ProjectManager } from "@/appcore/models/Project/ProjectManager";
import { VStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/shadcn/button";

export default function Test() {
	const bla = async () => {
		ProjectManager.getInstance().createProject();
	};

	return (
		<VStack>
			<Button onClick={bla}>Test</Button>
		</VStack>
	);
}

type TestForm = {
    name: string;
}