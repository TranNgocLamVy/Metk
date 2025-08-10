import { DialogService } from "@/appcore/services/DialogService";
import { DialogContainer } from "@/components/custom/DialogContainer/DialogContainer";
import { VStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/shadcn/button";

export default function Test() {
	const bla = async () => {
		const data = await DialogService.openFormDialog({
			title: "Create new Project",
			inputs: [
				{
                    id: "name",
					name: "name",
					type: "text",
					label: "Project Name",
					placeholder: "Enter your name",
					required: true,
                    validate: (value) => value.length >= 2 ? { valid: true } : { valid: false, message: "Name must be at least 2 characters long" },
				},
				{
                    id: "filePath",
					name: "filePath",
					type: "folderPath",
					label: "Folder Path",
					placeholder: "Select a folder",
					required: true,
				},
			],
		});
        console.log(data)
	};

	return (
		<VStack>
			<DialogContainer />
			<Button onClick={bla}>Test</Button>
		</VStack>
	);
}

type TestForm = {
    name: string;
}