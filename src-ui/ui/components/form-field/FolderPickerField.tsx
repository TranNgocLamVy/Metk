import { FileDialogUtils } from "@/shared/utils/file-dialog.utils";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from '@/ui/components/shadcn/button';
import { Input } from "@/ui/components/shadcn/input";
import { Label } from "@/ui/components/shadcn/label";
import { useTranslation } from "react-i18next";

type FolderPickerProps = {
	id: string;
	name: string;
	label: string;
	placeholder?: string;
	defaultDir?: string;
	required?: boolean;
	disabled?: boolean;
	value: string;
	handleChange?: (fieldName: string, raw: unknown) => void;
};

export default function FolderPickerField(props: FolderPickerProps) {
	const { t: translate } = useTranslation([]);
	const { id, name, label, placeholder, defaultDir, required, disabled, value, handleChange } = props;

	const selectFolder = async () => {
		const path = await FileDialogUtils.open({
			directory: true,
			defaultPath: defaultDir,
			multiple: false,
		});
		if (path) handleChange?.(name, path);
	};

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleChange?.(name, e.target.value);
    }

	return (
		<div className="grid grid-cols-[max-content_minmax(0,1fr)] h-full items-center gap-2">
		<Label htmlFor={id} className="text-2xs"><LocalizedText message={label} /></Label>
		<HStack className="gap-3">
			<Input
				id={id}
				name={name}
				type="text"
				placeholder={translate(placeholder)}
				value={value ?? ""}
				onChange={onChange}
				required={required}
				disabled={disabled}
				className="w-full text-2xs h-6"
				title={value ?? ""}
			/>
			<Button variant="outline" size="xs" className="text-2xs border-foreground/40" onClick={selectFolder}>
				<LocalizedText message={"form.tileset.image.browse"} />
			</Button>
		</HStack>
	</div>
		
	);
}
